const logger = require('../utils/logger');
const db = require('../utils/database');

class DeliveryTracker {
  /**
   * Track a notification delivery attempt
   * @param {Object} delivery - Delivery data
   */
  async trackDelivery(delivery) {
    try {
      const query = `
        INSERT INTO notification_deliveries (
          id, notification_id, user_id, type, recipient, status, 
          provider_id, provider, sent_at, error_message, metadata
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9
        ) RETURNING id
      `;

      const values = [
        delivery.notificationId,
        delivery.userId,
        delivery.type,
        delivery.recipient,
        delivery.status,
        delivery.providerId,
        delivery.provider,
        delivery.error,
        JSON.stringify(delivery.metadata || {})
      ];

      const result = await db.query(query, values);
      
      logger.info(`Delivery tracked: ${delivery.type} to ${delivery.recipient} - ${delivery.status}`);
      
      return result.rows[0].id;

    } catch (error) {
      logger.error('Failed to track delivery:', error);
      throw error;
    }
  }

  /**
   * Update delivery status from webhook
   * @param {Object} update - Status update data
   */
  async updateDeliveryStatus(update) {
    try {
      const query = `
        UPDATE notification_deliveries 
        SET 
          status = $1,
          delivered_at = $2,
          error_message = COALESCE($3, error_message),
          metadata = metadata || $4
        WHERE provider_id = $5
        RETURNING id, notification_id, user_id, type, recipient
      `;

      const values = [
        update.status,
        update.timestamp || new Date(),
        update.reason,
        JSON.stringify(update.metadata || {}),
        update.providerId
      ];

      const result = await db.query(query, values);

      if (result.rows.length > 0) {
        const delivery = result.rows[0];
        logger.info(`Delivery status updated: ${update.providerId} -> ${update.status}`);
        
        // Emit event for real-time updates
        this.emitDeliveryUpdate(delivery, update.status);
        
        return delivery;
      } else {
        logger.warn(`No delivery found for provider ID: ${update.providerId}`);
        return null;
      }

    } catch (error) {
      logger.error('Failed to update delivery status:', error);
      throw error;
    }
  }

  /**
   * Get delivery statistics
   * @param {Object} filters - Filter criteria
   */
  async getStats(filters = {}) {
    try {
      const whereConditions = [];
      const values = [];
      let paramCount = 0;

      // Add filters
      if (filters.tenantId) {
        whereConditions.push(`tenant_id = $${++paramCount}`);
        values.push(filters.tenantId);
      }

      if (filters.userId) {
        whereConditions.push(`user_id = $${++paramCount}`);
        values.push(filters.userId);
      }

      if (filters.type) {
        whereConditions.push(`type = $${++paramCount}`);
        values.push(filters.type);
      }

      if (filters.startDate) {
        whereConditions.push(`sent_at >= $${++paramCount}`);
        values.push(filters.startDate);
      }

      if (filters.endDate) {
        whereConditions.push(`sent_at <= $${++paramCount}`);
        values.push(filters.endDate);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      // Overall stats
      const overallQuery = `
        SELECT 
          type,
          status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (delivered_at - sent_at))) as avg_delivery_time
        FROM notification_deliveries 
        ${whereClause}
        GROUP BY type, status
        ORDER BY type, status
      `;

      // Daily stats for the last 30 days
      const dailyQuery = `
        SELECT 
          DATE(sent_at) as date,
          type,
          status,
          COUNT(*) as count
        FROM notification_deliveries 
        ${whereClause}
        AND sent_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(sent_at), type, status
        ORDER BY date DESC, type, status
      `;

      // Delivery rates
      const ratesQuery = `
        SELECT 
          type,
          COUNT(*) as total_sent,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'failed' OR status = 'bounced' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
          COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked
        FROM notification_deliveries 
        ${whereClause}
        GROUP BY type
      `;

      const [overallResult, dailyResult, ratesResult] = await Promise.all([
        db.query(overallQuery, values),
        db.query(dailyQuery, values),
        db.query(ratesQuery, values)
      ]);

      // Calculate delivery rates
      const deliveryRates = ratesResult.rows.map(row => ({
        type: row.type,
        totalSent: parseInt(row.total_sent),
        delivered: parseInt(row.delivered),
        failed: parseInt(row.failed),
        opened: parseInt(row.opened),
        clicked: parseInt(row.clicked),
        deliveryRate: row.total_sent > 0 ? (row.delivered / row.total_sent * 100).toFixed(2) : 0,
        openRate: row.type === 'email' && row.delivered > 0 ? (row.opened / row.delivered * 100).toFixed(2) : null,
        clickRate: row.type === 'email' && row.opened > 0 ? (row.clicked / row.opened * 100).toFixed(2) : null
      }));

      return {
        overall: overallResult.rows,
        daily: dailyResult.rows,
        rates: deliveryRates,
        summary: {
          totalSent: overallResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
          totalDelivered: overallResult.rows
            .filter(row => row.status === 'delivered')
            .reduce((sum, row) => sum + parseInt(row.count), 0),
          totalFailed: overallResult.rows
            .filter(row => ['failed', 'bounced'].includes(row.status))
            .reduce((sum, row) => sum + parseInt(row.count), 0)
        }
      };

    } catch (error) {
      logger.error('Failed to get delivery stats:', error);
      throw error;
    }
  }

  /**
   * Get delivery history for a specific notification or user
   * @param {Object} filters - Filter criteria
   */
  async getDeliveryHistory(filters = {}) {
    try {
      const whereConditions = [];
      const values = [];
      let paramCount = 0;

      if (filters.notificationId) {
        whereConditions.push(`notification_id = $${++paramCount}`);
        values.push(filters.notificationId);
      }

      if (filters.userId) {
        whereConditions.push(`user_id = $${++paramCount}`);
        values.push(filters.userId);
      }

      if (filters.recipient) {
        whereConditions.push(`recipient = $${++paramCount}`);
        values.push(filters.recipient);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

      const query = `
        SELECT 
          id, notification_id, user_id, type, recipient, status,
          provider_id, provider, sent_at, delivered_at, error_message,
          metadata
        FROM notification_deliveries 
        ${whereClause}
        ORDER BY sent_at DESC
        LIMIT ${filters.limit || 100}
        OFFSET ${filters.offset || 0}
      `;

      const result = await db.query(query, values);

      return result.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }));

    } catch (error) {
      logger.error('Failed to get delivery history:', error);
      throw error;
    }
  }

  /**
   * Get failed deliveries for retry
   * @param {Object} filters - Filter criteria
   */
  async getFailedDeliveries(filters = {}) {
    try {
      const query = `
        SELECT 
          id, notification_id, user_id, type, recipient, 
          provider_id, error_message, sent_at, metadata
        FROM notification_deliveries 
        WHERE status IN ('failed', 'bounced')
        AND sent_at >= NOW() - INTERVAL '24 hours'
        AND (metadata->>'retry_count')::int < 3
        ORDER BY sent_at ASC
        LIMIT ${filters.limit || 100}
      `;

      const result = await db.query(query);
      
      return result.rows.map(row => ({
        ...row,
        metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata
      }));

    } catch (error) {
      logger.error('Failed to get failed deliveries:', error);
      throw error;
    }
  }

  /**
   * Mark delivery for retry
   * @param {string} deliveryId - Delivery ID
   */
  async markForRetry(deliveryId) {
    try {
      const query = `
        UPDATE notification_deliveries 
        SET 
          status = 'retry',
          metadata = metadata || jsonb_build_object(
            'retry_count', 
            COALESCE((metadata->>'retry_count')::int, 0) + 1,
            'retry_at', 
            NOW()
          )
        WHERE id = $1
        RETURNING id, notification_id, user_id, type, recipient
      `;

      const result = await db.query(query, [deliveryId]);
      
      if (result.rows.length > 0) {
        logger.info(`Delivery marked for retry: ${deliveryId}`);
        return result.rows[0];
      }
      
      return null;

    } catch (error) {
      logger.error('Failed to mark delivery for retry:', error);
      throw error;
    }
  }

  /**
   * Clean up old delivery records
   * @param {number} daysToKeep - Number of days to keep records
   */
  async cleanupOldDeliveries(daysToKeep = 90) {
    try {
      const query = `
        DELETE FROM notification_deliveries 
        WHERE sent_at < NOW() - INTERVAL '${daysToKeep} days'
      `;

      const result = await db.query(query);
      
      logger.info(`Cleaned up ${result.rowCount} old delivery records`);
      
      return result.rowCount;

    } catch (error) {
      logger.error('Failed to cleanup old deliveries:', error);
      throw error;
    }
  }

  /**
   * Emit delivery update event for real-time notifications
   * @param {Object} delivery - Delivery data
   * @param {string} status - New status
   */
  emitDeliveryUpdate(delivery, status) {
    try {
      // In a real application, this would emit to WebSocket, Server-Sent Events, or message queue
      const event = {
        type: 'delivery_update',
        data: {
          deliveryId: delivery.id,
          notificationId: delivery.notification_id,
          userId: delivery.user_id,
          recipient: delivery.recipient,
          status: status,
          timestamp: new Date()
        }
      };

      // For now, just log the event
      logger.info('Delivery update event:', event);
      
      // TODO: Implement real-time event emission
      // eventEmitter.emit('delivery_update', event);
      // socketIO.to(`user_${delivery.user_id}`).emit('delivery_update', event);

    } catch (error) {
      logger.error('Failed to emit delivery update:', error);
    }
  }
}

module.exports = new DeliveryTracker();








