const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const logger = require('../utils/logger');
const TemplateService = require('./TemplateService');
const DeliveryTracker = require('./DeliveryTracker');
const ComplianceService = require('./ComplianceService');
const QueueService = require('./QueueService');

class NotificationService {
  constructor() {
    this.sendGridClient = null;
    this.twilioClient = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Initialize SendGrid
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sendGridClient = sgMail;
        logger.info('SendGrid initialized successfully');
      } else {
        logger.warn('SendGrid API key not found - email notifications disabled');
      }

      // Initialize Twilio
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        logger.info('Twilio initialized successfully');
      } else {
        logger.warn('Twilio credentials not found - SMS notifications disabled');
      }

      this.isInitialized = true;
      logger.info('NotificationService initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  /**
   * Send notification to single recipient
   * @param {Object} notification - Notification data
   * @param {string} notification.type - 'email' or 'sms'
   * @param {string} notification.recipient - Email or phone number
   * @param {string} notification.template - Template name
   * @param {Object} notification.data - Template data
   * @param {Object} notification.metadata - Additional metadata
   */
  async sendNotification(notification) {
    try {
      if (!this.isInitialized) {
        throw new Error('NotificationService not initialized');
      }

      // Validate notification
      this.validateNotification(notification);

      // Check compliance (opt-outs, rate limits, etc.) - skip for demo
      if (process.env.DEMO_MODE === 'true' || process.env.SKIP_COMPLIANCE_CHECKS === 'true') {
        logger.info('Skipping compliance checks for demo mode');
      } else {
        const complianceCheck = await ComplianceService.checkCompliance(notification);
        if (!complianceCheck.allowed) {
          logger.warn('Notification blocked by compliance:', complianceCheck.reason);
          return { success: false, reason: complianceCheck.reason };
        }
      }

      let result;
      
      if (notification.type === 'email') {
        result = await this.sendEmail(notification);
      } else if (notification.type === 'sms') {
        result = await this.sendSMS(notification);
      } else {
        throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      // Track delivery - skip in demo mode
      if (process.env.DEMO_MODE !== 'true') {
        await DeliveryTracker.trackDelivery({
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type,
          recipient: notification.recipient,
          status: result.success ? 'sent' : 'failed',
          providerId: result.providerId,
          error: result.error,
          metadata: notification.metadata
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to send notification:', error);
      
      // Track failed delivery - skip in demo mode
      if (process.env.DEMO_MODE !== 'true') {
        await DeliveryTracker.trackDelivery({
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type,
          recipient: notification.recipient,
          status: 'failed',
          error: error.message,
          metadata: notification.metadata
        });
      }

      throw error;
    }
  }

  /**
   * Send bulk notifications (queued processing)
   * @param {Array} notifications - Array of notification objects
   */
  async sendBulkNotifications(notifications) {
    try {
      logger.info(`Queuing ${notifications.length} notifications for bulk processing`);

      // Add notifications to queue for processing
      const jobs = notifications.map(notification => 
        QueueService.addNotificationJob(notification)
      );

      const results = await Promise.allSettled(jobs);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Bulk notifications queued: ${successful} successful, ${failed} failed`);

      return {
        total: notifications.length,
        queued: successful,
        failed: failed,
        results: results
      };

    } catch (error) {
      logger.error('Failed to queue bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(notification) {
    try {
      if (!this.sendGridClient) {
        throw new Error('SendGrid not initialized');
      }

      // Get email template
      const template = await TemplateService.getEmailTemplate(
        notification.template,
        notification.data
      );

      const msg = {
        to: notification.recipient,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@hoaconnect.com',
          name: process.env.FROM_NAME || 'HOA Connect'
        },
        subject: template.subject,
        html: template.html,
        text: template.text,
        // Custom headers for tracking
        customArgs: {
          notificationId: notification.id,
          userId: notification.userId,
          template: notification.template
        },
        // Unsubscribe handling
        asm: {
          groupId: this.getUnsubscribeGroup(notification.template)
        }
      };

      // Add attachments if present
      if (notification.attachments && notification.attachments.length > 0) {
        msg.attachments = notification.attachments.map(attachment => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type,
          disposition: 'attachment'
        }));
      }

      const result = await this.sendGridClient.send(msg);
      
      logger.info(`Email sent successfully to ${notification.recipient}`);
      
      return {
        success: true,
        providerId: result[0].headers['x-message-id'],
        provider: 'sendgrid'
      };

    } catch (error) {
      logger.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message,
        provider: 'sendgrid'
      };
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(notification) {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio not initialized');
      }

      // Get SMS template
      const template = await TemplateService.getSMSTemplate(
        notification.template,
        notification.data
      );

      // Ensure phone number is in E.164 format
      const phoneNumber = this.formatPhoneNumber(notification.recipient);

      const messageOptions = {
        body: template.text,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      };

      // Only add webhook and messaging service in production with proper config
      if (process.env.API_BASE_URL && process.env.DEMO_MODE !== 'true') {
        messageOptions.statusCallback = `${process.env.API_BASE_URL}/api/notifications/sms-webhook`;
        messageOptions.provideTags = true;
      }

      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        messageOptions.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
      }

      const message = await this.twilioClient.messages.create(messageOptions);

      logger.info(`SMS sent successfully to ${notification.recipient}`);

      return {
        success: true,
        providerId: message.sid,
        provider: 'twilio'
      };

    } catch (error) {
      logger.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error.message,
        provider: 'twilio'
      };
    }
  }

  /**
   * Handle SendGrid webhooks for delivery tracking
   */
  async handleSendGridWebhook(events) {
    try {
      for (const event of events) {
        await DeliveryTracker.updateDeliveryStatus({
          providerId: event.sg_message_id,
          status: this.mapSendGridStatus(event.event),
          timestamp: new Date(event.timestamp * 1000),
          reason: event.reason,
          metadata: {
            event: event.event,
            useragent: event.useragent,
            ip: event.ip,
            url: event.url
          }
        });
      }
      
      logger.info(`Processed ${events.length} SendGrid webhook events`);
    } catch (error) {
      logger.error('Failed to process SendGrid webhook:', error);
      throw error;
    }
  }

  /**
   * Handle Twilio webhooks for delivery tracking
   */
  async handleTwilioWebhook(status, messageSid) {
    try {
      await DeliveryTracker.updateDeliveryStatus({
        providerId: messageSid,
        status: this.mapTwilioStatus(status),
        timestamp: new Date(),
        metadata: { twilioStatus: status }
      });
      
      logger.info(`Updated Twilio message status: ${messageSid} -> ${status}`);
    } catch (error) {
      logger.error('Failed to process Twilio webhook:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(filters = {}) {
    try {
      return await DeliveryTracker.getStats(filters);
    } catch (error) {
      logger.error('Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Validate notification object
   */
  validateNotification(notification) {
    const required = ['type', 'recipient', 'template', 'data'];
    
    for (const field of required) {
      if (!notification[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!['email', 'sms'].includes(notification.type)) {
      throw new Error(`Invalid notification type: ${notification.type}`);
    }

    if (notification.type === 'email' && !this.isValidEmail(notification.recipient)) {
      throw new Error(`Invalid email address: ${notification.recipient}`);
    }

    if (notification.type === 'sms' && !this.isValidPhoneNumber(notification.recipient)) {
      throw new Error(`Invalid phone number: ${notification.recipient}`);
    }
  }

  /**
   * Utility methods
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  formatPhoneNumber(phone) {
    // Simple E.164 formatting - in production, use a proper phone number library
    let formatted = phone.replace(/\D/g, '');
    if (formatted.length === 10) {
      formatted = '1' + formatted; // Add US country code
    }
    return '+' + formatted;
  }

  getUnsubscribeGroup(template) {
    // Map templates to SendGrid unsubscribe groups
    const groups = {
      'request_notification': 1,
      'board_notification': 2,
      'form_reminder': 3,
      'community_announcement': 4
    };
    return groups[template] || 1;
  }

  mapSendGridStatus(event) {
    const statusMap = {
      'delivered': 'delivered',
      'bounce': 'bounced',
      'dropped': 'failed',
      'deferred': 'deferred',
      'processed': 'sent',
      'open': 'opened',
      'click': 'clicked',
      'unsubscribe': 'unsubscribed',
      'spamreport': 'spam'
    };
    return statusMap[event] || 'unknown';
  }

  mapTwilioStatus(status) {
    const statusMap = {
      'delivered': 'delivered',
      'failed': 'failed',
      'undelivered': 'failed',
      'sent': 'sent',
      'received': 'delivered'
    };
    return statusMap[status] || 'unknown';
  }
}

module.exports = new NotificationService();
