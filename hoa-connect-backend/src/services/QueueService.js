const Bull = require('bull');
const logger = require('../utils/logger');
const NotificationService = require('./NotificationService');

class QueueService {
  constructor() {
    this.queues = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0
      };

      // Create notification queue
      this.queues.notifications = new Bull('notifications', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 100, // Keep last 100 completed jobs
          removeOnFail: 50,      // Keep last 50 failed jobs
          attempts: 3,           // Retry failed jobs 3 times
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      // Create bulk notification queue
      this.queues.bulkNotifications = new Bull('bulk-notifications', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000
          }
        }
      });

      // Create scheduled notification queue
      this.queues.scheduledNotifications = new Bull('scheduled-notifications', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        }
      });

      // Set up job processors
      this.setupProcessors();

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      logger.info('QueueService initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize QueueService:', error);
      throw error;
    }
  }

  setupProcessors() {
    // Single notification processor
    this.queues.notifications.process('send-notification', 5, async (job) => {
      const { notification } = job.data;
      
      try {
        logger.info(`Processing notification job ${job.id} for ${notification.recipient}`);
        
        const result = await NotificationService.sendNotification(notification);
        
        if (!result.success) {
          throw new Error(result.error || 'Notification failed');
        }
        
        return result;
        
      } catch (error) {
        logger.error(`Notification job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Bulk notification processor
    this.queues.bulkNotifications.process('send-bulk', 2, async (job) => {
      const { notifications, batchSize = 10 } = job.data;
      
      try {
        logger.info(`Processing bulk notification job ${job.id} with ${notifications.length} notifications`);
        
        const results = [];
        
        // Process in batches to avoid overwhelming the services
        for (let i = 0; i < notifications.length; i += batchSize) {
          const batch = notifications.slice(i, i + batchSize);
          
          const batchPromises = batch.map(notification => 
            NotificationService.sendNotification(notification)
              .catch(error => ({ success: false, error: error.message, notification }))
          );
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
          
          // Update job progress
          const progress = Math.round(((i + batch.length) / notifications.length) * 100);
          job.progress(progress);
          
          // Small delay between batches
          if (i + batchSize < notifications.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        logger.info(`Bulk notification job ${job.id} completed: ${successful} successful, ${failed} failed`);
        
        return {
          total: notifications.length,
          successful,
          failed,
          results
        };
        
      } catch (error) {
        logger.error(`Bulk notification job ${job.id} failed:`, error);
        throw error;
      }
    });

    // Scheduled notification processor
    this.queues.scheduledNotifications.process('send-scheduled', 10, async (job) => {
      const { notification, scheduledFor } = job.data;
      
      try {
        logger.info(`Processing scheduled notification job ${job.id} (scheduled for ${scheduledFor})`);
        
        // Check if it's time to send
        const now = new Date();
        const sendTime = new Date(scheduledFor);
        
        if (now < sendTime) {
          // Reschedule for later
          const delay = sendTime.getTime() - now.getTime();
          await this.scheduleNotification(notification, sendTime);
          return { rescheduled: true, delay };
        }
        
        const result = await NotificationService.sendNotification(notification);
        
        if (!result.success) {
          throw new Error(result.error || 'Scheduled notification failed');
        }
        
        return result;
        
      } catch (error) {
        logger.error(`Scheduled notification job ${job.id} failed:`, error);
        throw error;
      }
    });
  }

  setupEventListeners() {
    Object.keys(this.queues).forEach(queueName => {
      const queue = this.queues[queueName];
      
      queue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} in queue ${queueName} completed`);
      });
      
      queue.on('failed', (job, error) => {
        logger.error(`Job ${job.id} in queue ${queueName} failed:`, error);
      });
      
      queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} in queue ${queueName} stalled`);
      });
      
      queue.on('progress', (job, progress) => {
        logger.debug(`Job ${job.id} in queue ${queueName} progress: ${progress}%`);
      });
    });
  }

  /**
   * Add a single notification to the queue
   * @param {Object} notification - Notification data
   * @param {Object} options - Job options
   */
  async addNotificationJob(notification, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('QueueService not initialized');
      }

      const jobOptions = Object.assign({
        priority: this.getJobPriority(notification),
        delay: options.delay || 0
      }, options);

      const job = await this.queues.notifications.add('send-notification', {
        notification
      }, jobOptions);

      logger.info(`Notification job ${job.id} added to queue for ${notification.recipient}`);
      
      return job;

    } catch (error) {
      logger.error('Failed to add notification job:', error);
      throw error;
    }
  }

  /**
   * Add bulk notifications to the queue
   * @param {Array} notifications - Array of notification objects
   * @param {Object} options - Job options
   */
  async addBulkNotificationJob(notifications, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('QueueService not initialized');
      }

      const jobOptions = {
        priority: options.priority || 5,
        delay: options.delay || 0,
        ...options
      };

      const job = await this.queues.bulkNotifications.add('send-bulk', {
        notifications,
        batchSize: options.batchSize || 10
      }, jobOptions);

      logger.info(`Bulk notification job ${job.id} added to queue with ${notifications.length} notifications`);
      
      return job;

    } catch (error) {
      logger.error('Failed to add bulk notification job:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for future delivery
   * @param {Object} notification - Notification data
   * @param {Date} scheduledFor - When to send the notification
   * @param {Object} options - Job options
   */
  async scheduleNotification(notification, scheduledFor, options = {}) {
    try {
      if (!this.isInitialized) {
        throw new Error('QueueService not initialized');
      }

      const delay = scheduledFor.getTime() - Date.now();
      
      if (delay < 0) {
        throw new Error('Cannot schedule notification in the past');
      }

      const jobOptions = {
        priority: this.getJobPriority(notification),
        delay: delay,
        ...options
      };

      const job = await this.queues.scheduledNotifications.add('send-scheduled', {
        notification,
        scheduledFor: scheduledFor.toISOString()
      }, jobOptions);

      logger.info(`Scheduled notification job ${job.id} added for ${scheduledFor.toISOString()}`);
      
      return job;

    } catch (error) {
      logger.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Get job priority based on notification type and template
   * @param {Object} notification - Notification data
   */
  getJobPriority(notification) {
    const priorityMap = {
      // High priority (1-3)
      emergency_alert: 1,
      security_notification: 2,
      urgent_request: 3,
      
      // Medium priority (4-6)
      request_notification: 4,
      board_notification: 5,
      form_reminder: 6,
      
      // Low priority (7-10)
      community_announcement: 7,
      newsletter: 8,
      marketing: 9,
      general: 10
    };

    return priorityMap[notification.template] || 5;
  }

  /**
   * Get queue statistics
   * @param {string} queueName - Queue name (optional)
   */
  async getQueueStats(queueName = null) {
    try {
      const stats = {};
      
      const queues = queueName ? [queueName] : Object.keys(this.queues);
      
      for (const name of queues) {
        if (!this.queues[name]) continue;
        
        const queue = this.queues[name];
        
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaiting(),
          queue.getActive(),
          queue.getCompleted(),
          queue.getFailed(),
          queue.getDelayed()
        ]);

        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
          total: waiting.length + active.length + completed.length + failed.length + delayed.length
        };
      }
      
      return queueName ? stats[queueName] : stats;

    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Retry failed jobs
   * @param {string} queueName - Queue name
   * @param {number} limit - Maximum number of jobs to retry
   */
  async retryFailedJobs(queueName, limit = 10) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const queue = this.queues[queueName];
      const failedJobs = await queue.getFailed(0, limit - 1);
      
      const retryPromises = failedJobs.map(job => job.retry());
      await Promise.all(retryPromises);
      
      logger.info(`Retried ${failedJobs.length} failed jobs in queue ${queueName}`);
      
      return failedJobs.length;

    } catch (error) {
      logger.error('Failed to retry jobs:', error);
      throw error;
    }
  }

  /**
   * Clean up completed and failed jobs
   * @param {string} queueName - Queue name
   * @param {number} grace - Grace period in milliseconds
   */
  async cleanQueue(queueName, grace = 24 * 60 * 60 * 1000) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      const queue = this.queues[queueName];
      
      await queue.clean(grace, 'completed');
      await queue.clean(grace, 'failed');
      
      logger.info(`Cleaned queue ${queueName} with grace period ${grace}ms`);

    } catch (error) {
      logger.error('Failed to clean queue:', error);
      throw error;
    }
  }

  /**
   * Pause a queue
   * @param {string} queueName - Queue name
   */
  async pauseQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await this.queues[queueName].pause();
      logger.info(`Queue ${queueName} paused`);

    } catch (error) {
      logger.error('Failed to pause queue:', error);
      throw error;
    }
  }

  /**
   * Resume a queue
   * @param {string} queueName - Queue name
   */
  async resumeQueue(queueName) {
    try {
      if (!this.queues[queueName]) {
        throw new Error(`Queue ${queueName} not found`);
      }

      await this.queues[queueName].resume();
      logger.info(`Queue ${queueName} resumed`);

    } catch (error) {
      logger.error('Failed to resume queue:', error);
      throw error;
    }
  }

  /**
   * Gracefully close all queues
   */
  async close() {
    try {
      const closePromises = Object.values(this.queues).map(queue => queue.close());
      await Promise.all(closePromises);
      
      logger.info('All queues closed successfully');

    } catch (error) {
      logger.error('Failed to close queues:', error);
      throw error;
    }
  }
}

module.exports = new QueueService();








