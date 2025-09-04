const logger = require('../utils/logger');
const db = require('../utils/database');

class ComplianceService {
  /**
   * Check if notification is compliant with regulations and user preferences
   * @param {Object} notification - Notification data
   * @returns {Object} Compliance check result
   */
  async checkCompliance(notification) {
    try {
      const checks = await Promise.all([
        this.checkOptOutStatus(notification),
        this.checkRateLimits(notification),
        this.checkUserPreferences(notification),
        this.checkBusinessHours(notification),
        this.checkContentCompliance(notification)
      ]);

      const failedChecks = checks.filter(check => !check.passed);
      
      if (failedChecks.length > 0) {
        return {
          allowed: false,
          reason: failedChecks.map(check => check.reason).join('; '),
          failedChecks: failedChecks
        };
      }

      return {
        allowed: true,
        reason: 'All compliance checks passed',
        checks: checks
      };

    } catch (error) {
      logger.error('Compliance check failed:', error);
      return {
        allowed: false,
        reason: 'Compliance check error',
        error: error.message
      };
    }
  }

  /**
   * Check if user has opted out of notifications
   * @param {Object} notification - Notification data
   */
  async checkOptOutStatus(notification) {
    try {
      const query = `
        SELECT id, type, opted_out_at, reason 
        FROM communication_opt_outs 
        WHERE user_id = $1 
        AND (type = $2 OR type = 'all')
        AND opted_out_at IS NOT NULL
        ORDER BY opted_out_at DESC
        LIMIT 1
      `;

      const result = await db.query(query, [notification.userId, notification.type]);

      if (result.rows.length > 0) {
        const optOut = result.rows[0];
        return {
          passed: false,
          reason: `User opted out of ${optOut.type} notifications on ${optOut.opted_out_at}`,
          data: optOut
        };
      }

      return {
        passed: true,
        reason: 'User has not opted out',
        data: null
      };

    } catch (error) {
      logger.error('Failed to check opt-out status:', error);
      return {
        passed: false,
        reason: 'Failed to check opt-out status',
        error: error.message
      };
    }
  }

  /**
   * Check rate limits to prevent spam
   * @param {Object} notification - Notification data
   */
  async checkRateLimits(notification) {
    try {
      const limits = this.getRateLimits(notification.type, notification.template);
      
      // Check hourly limit
      const hourlyQuery = `
        SELECT COUNT(*) as count
        FROM notification_deliveries 
        WHERE user_id = $1 
        AND type = $2 
        AND sent_at >= NOW() - INTERVAL '1 hour'
      `;

      const hourlyResult = await db.query(hourlyQuery, [notification.userId, notification.type]);
      const hourlySent = parseInt(hourlyResult.rows[0].count);

      if (hourlySent >= limits.hourly) {
        return {
          passed: false,
          reason: `Hourly rate limit exceeded: ${hourlySent}/${limits.hourly}`,
          data: { limit: limits.hourly, current: hourlySent, period: 'hourly' }
        };
      }

      // Check daily limit
      const dailyQuery = `
        SELECT COUNT(*) as count
        FROM notification_deliveries 
        WHERE user_id = $1 
        AND type = $2 
        AND sent_at >= NOW() - INTERVAL '24 hours'
      `;

      const dailyResult = await db.query(dailyQuery, [notification.userId, notification.type]);
      const dailySent = parseInt(dailyResult.rows[0].count);

      if (dailySent >= limits.daily) {
        return {
          passed: false,
          reason: `Daily rate limit exceeded: ${dailySent}/${limits.daily}`,
          data: { limit: limits.daily, current: dailySent, period: 'daily' }
        };
      }

      return {
        passed: true,
        reason: 'Rate limits not exceeded',
        data: { 
          hourly: { limit: limits.hourly, current: hourlySent },
          daily: { limit: limits.daily, current: dailySent }
        }
      };

    } catch (error) {
      logger.error('Failed to check rate limits:', error);
      return {
        passed: false,
        reason: 'Failed to check rate limits',
        error: error.message
      };
    }
  }

  /**
   * Check user notification preferences
   * @param {Object} notification - Notification data
   */
  async checkUserPreferences(notification) {
    try {
      const query = `
        SELECT 
          email_enabled, 
          sms_enabled, 
          notification_types,
          quiet_hours_start,
          quiet_hours_end,
          timezone
        FROM notification_preferences 
        WHERE user_id = $1
      `;

      const result = await db.query(query, [notification.userId]);

      if (result.rows.length === 0) {
        // No preferences set, assume defaults (enabled)
        return {
          passed: true,
          reason: 'No preferences set, using defaults',
          data: null
        };
      }

      const prefs = result.rows[0];

      // Check if notification type is enabled
      if (notification.type === 'email' && !prefs.email_enabled) {
        return {
          passed: false,
          reason: 'User has disabled email notifications',
          data: prefs
        };
      }

      if (notification.type === 'sms' && !prefs.sms_enabled) {
        return {
          passed: false,
          reason: 'User has disabled SMS notifications',
          data: prefs
        };
      }

      // Check if specific notification type is allowed
      if (prefs.notification_types) {
        const allowedTypes = Array.isArray(prefs.notification_types) 
          ? prefs.notification_types 
          : JSON.parse(prefs.notification_types);
        
        if (!allowedTypes.includes(notification.template)) {
          return {
            passed: false,
            reason: `User has disabled ${notification.template} notifications`,
            data: prefs
          };
        }
      }

      return {
        passed: true,
        reason: 'User preferences allow notification',
        data: prefs
      };

    } catch (error) {
      logger.error('Failed to check user preferences:', error);
      return {
        passed: false,
        reason: 'Failed to check user preferences',
        error: error.message
      };
    }
  }

  /**
   * Check business hours and quiet time restrictions
   * @param {Object} notification - Notification data
   */
  async checkBusinessHours(notification) {
    try {
      // Skip business hours check for urgent notifications
      const urgentTemplates = ['emergency_alert', 'security_notification'];
      if (urgentTemplates.includes(notification.template)) {
        return {
          passed: true,
          reason: 'Urgent notification bypasses business hours',
          data: null
        };
      }

      const now = new Date();
      const hour = now.getHours();

      // General business hours: 8 AM to 8 PM
      const businessStart = 8;
      const businessEnd = 20;

      // SMS has stricter hours: 9 AM to 6 PM
      if (notification.type === 'sms') {
        const smsStart = 9;
        const smsEnd = 18;

        if (hour < smsStart || hour >= smsEnd) {
          return {
            passed: false,
            reason: `SMS outside allowed hours (${smsStart}:00-${smsEnd}:00)`,
            data: { currentHour: hour, allowedStart: smsStart, allowedEnd: smsEnd }
          };
        }
      }

      // Email has more lenient hours
      if (notification.type === 'email' && (hour < businessStart || hour >= businessEnd)) {
        // Allow email outside business hours for non-marketing content
        const marketingTemplates = ['community_announcement', 'newsletter'];
        if (marketingTemplates.includes(notification.template)) {
          return {
            passed: false,
            reason: `Marketing email outside business hours (${businessStart}:00-${businessEnd}:00)`,
            data: { currentHour: hour, allowedStart: businessStart, allowedEnd: businessEnd }
          };
        }
      }

      return {
        passed: true,
        reason: 'Within allowed business hours',
        data: { currentHour: hour }
      };

    } catch (error) {
      logger.error('Failed to check business hours:', error);
      return {
        passed: false,
        reason: 'Failed to check business hours',
        error: error.message
      };
    }
  }

  /**
   * Check content compliance (CAN-SPAM, TCPA, etc.)
   * @param {Object} notification - Notification data
   */
  async checkContentCompliance(notification) {
    try {
      const checks = [];

      // For email notifications
      if (notification.type === 'email') {
        // Check for required unsubscribe information
        if (!notification.data.unsubscribe_url) {
          checks.push('Missing unsubscribe URL');
        }

        // Check for sender identification
        if (!notification.data.sender_name || !notification.data.sender_address) {
          checks.push('Missing sender identification');
        }

        // Check subject line length and content
        if (notification.data.subject && notification.data.subject.length > 78) {
          checks.push('Subject line too long (>78 characters)');
        }
      }

      // For SMS notifications
      if (notification.type === 'sms') {
        // Check for STOP instructions
        const message = notification.data.message || '';
        if (!message.toLowerCase().includes('stop') && !message.toLowerCase().includes('opt out')) {
          checks.push('Missing opt-out instructions (STOP)');
        }

        // Check message length
        if (message.length > 160) {
          checks.push('SMS message too long (>160 characters)');
        }
      }

      if (checks.length > 0) {
        return {
          passed: false,
          reason: `Content compliance issues: ${checks.join(', ')}`,
          data: { issues: checks }
        };
      }

      return {
        passed: true,
        reason: 'Content compliance checks passed',
        data: null
      };

    } catch (error) {
      logger.error('Failed to check content compliance:', error);
      return {
        passed: false,
        reason: 'Failed to check content compliance',
        error: error.message
      };
    }
  }

  /**
   * Record opt-out request
   * @param {Object} optOut - Opt-out data
   */
  async recordOptOut(optOut) {
    try {
      const query = `
        INSERT INTO communication_opt_outs (
          id, user_id, type, opted_out_at, reason, source, metadata
        ) VALUES (
          gen_random_uuid(), $1, $2, NOW(), $3, $4, $5
        ) RETURNING id
      `;

      const values = [
        optOut.userId,
        optOut.type, // 'email', 'sms', or 'all'
        optOut.reason,
        optOut.source, // 'unsubscribe_link', 'sms_stop', 'user_preference', etc.
        JSON.stringify(optOut.metadata || {})
      ];

      const result = await db.query(query, values);
      
      logger.info(`Opt-out recorded: User ${optOut.userId} opted out of ${optOut.type} via ${optOut.source}`);
      
      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to record opt-out:', error);
      throw error;
    }
  }

  /**
   * Process SMS STOP command
   * @param {string} phoneNumber - Phone number that sent STOP
   * @param {string} message - SMS message content
   */
  async processSMSStop(phoneNumber, message) {
    try {
      // Find user by phone number
      const userQuery = `
        SELECT id FROM users WHERE phone = $1
      `;
      
      const userResult = await db.query(userQuery, [phoneNumber]);
      
      if (userResult.rows.length === 0) {
        logger.warn(`SMS STOP received from unknown number: ${phoneNumber}`);
        return null;
      }

      const userId = userResult.rows[0].id;
      
      // Record opt-out
      await this.recordOptOut({
        userId: userId,
        type: 'sms',
        reason: 'SMS STOP command',
        source: 'sms_stop',
        metadata: {
          phoneNumber: phoneNumber,
          message: message,
          timestamp: new Date()
        }
      });

      logger.info(`SMS opt-out processed for user ${userId} (${phoneNumber})`);
      
      return userId;

    } catch (error) {
      logger.error('Failed to process SMS STOP:', error);
      throw error;
    }
  }

  /**
   * Get rate limits for notification type and template
   * @param {string} type - Notification type
   * @param {string} template - Template name
   */
  getRateLimits(type, template) {
    const defaultLimits = {
      email: { hourly: 10, daily: 50 },
      sms: { hourly: 5, daily: 20 }
    };

    const templateLimits = {
      // Urgent notifications have higher limits
      emergency_alert: { hourly: 20, daily: 100 },
      security_notification: { hourly: 15, daily: 75 },
      
      // Marketing has lower limits
      community_announcement: { hourly: 2, daily: 5 },
      newsletter: { hourly: 1, daily: 2 },
      
      // Transactional notifications
      request_notification: { hourly: 8, daily: 30 },
      board_notification: { hourly: 6, daily: 25 },
      form_reminder: { hourly: 3, daily: 10 }
    };

    return templateLimits[template] || defaultLimits[type] || { hourly: 5, daily: 20 };
  }

  /**
   * Get compliance report for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filter criteria
   */
  async getComplianceReport(tenantId, filters = {}) {
    try {
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = filters.endDate || new Date();

      // Opt-out statistics
      const optOutQuery = `
        SELECT 
          type,
          source,
          COUNT(*) as count,
          DATE(opted_out_at) as date
        FROM communication_opt_outs co
        JOIN users u ON co.user_id = u.id
        WHERE u.tenant_id = $1
        AND co.opted_out_at BETWEEN $2 AND $3
        GROUP BY type, source, DATE(opted_out_at)
        ORDER BY date DESC
      `;

      // Delivery statistics
      const deliveryQuery = `
        SELECT 
          type,
          status,
          COUNT(*) as count,
          DATE(sent_at) as date
        FROM notification_deliveries nd
        JOIN users u ON nd.user_id = u.id
        WHERE u.tenant_id = $1
        AND nd.sent_at BETWEEN $2 AND $3
        GROUP BY type, status, DATE(sent_at)
        ORDER BY date DESC
      `;

      // Rate limit violations
      const rateLimitQuery = `
        SELECT 
          COUNT(*) as violations,
          DATE(created_at) as date
        FROM compliance_violations
        WHERE tenant_id = $1
        AND violation_type = 'rate_limit'
        AND created_at BETWEEN $2 AND $3
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      const [optOutResult, deliveryResult, rateLimitResult] = await Promise.all([
        db.query(optOutQuery, [tenantId, startDate, endDate]),
        db.query(deliveryQuery, [tenantId, startDate, endDate]),
        db.query(rateLimitQuery, [tenantId, startDate, endDate])
      ]);

      return {
        period: { startDate, endDate },
        optOuts: optOutResult.rows,
        deliveries: deliveryResult.rows,
        rateLimitViolations: rateLimitResult.rows,
        summary: {
          totalOptOuts: optOutResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          totalDeliveries: deliveryResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          totalViolations: rateLimitResult.rows.reduce((sum, row) => sum + parseInt(row.violations), 0)
        }
      };

    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw error;
    }
  }
}

module.exports = new ComplianceService();








