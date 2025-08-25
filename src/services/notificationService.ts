import { User } from '../types';

export interface NotificationData {
  type: 'email' | 'sms';
  recipient: string;
  template: string;
  data: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class NotificationService {
  private apiBaseUrl: string;
  private isProduction: boolean;

  constructor() {
    // Use environment variable or fallback to localhost for development
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Send a single notification
   */
  async sendNotification(notification: NotificationData): Promise<NotificationResult> {
    try {
      // Skip demo mode - always send real notifications
      console.log('📧 Sending Real Notification:', notification);

      const response = await fetch(`${this.apiBaseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          id: `notif-${Date.now()}`,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: NotificationData[]): Promise<NotificationResult[]> {
    try {
      // Skip demo mode - always send real bulk notifications
      console.log('📧 Sending Real Bulk Notifications:', notifications.length, 'notifications');

      const response = await fetch(`${this.apiBaseUrl}/api/notifications/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notifications: notifications.map(notif => ({
            ...notif,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString()
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.results || [];

    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      return notifications.map(() => ({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }

  /**
   * Send request status notification to homeowner
   */
  async notifyHomeownerStatusChange(
    homeowner: User,
    requestTitle: string,
    oldStatus: string,
    newStatus: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    const notifications: NotificationData[] = [];

    // Email notification
    if (homeowner.email) {
      notifications.push({
        type: 'email',
        recipient: homeowner.email,
        template: 'request_status_update',
        userId: homeowner.id,
        data: {
          homeowner_name: homeowner.name,
          request_title: requestTitle,
          old_status: oldStatus,
          new_status: newStatus,
          status_message: this.getStatusMessage(newStatus),
          login_url: `${window.location.origin}`,
          ...additionalData
        }
      });
    }

    // SMS notification for critical updates
    const criticalStatuses = ['approved', 'rejected', 'requires_changes'];
    if (homeowner.phone && criticalStatuses.includes(newStatus)) {
      notifications.push({
        type: 'sms',
        recipient: homeowner.phone,
        template: 'request_status_sms',
        userId: homeowner.id,
        data: {
          homeowner_name: homeowner.name.split(' ')[0], // First name only for SMS
          request_title: requestTitle,
          new_status: newStatus,
          status_message: this.getStatusMessage(newStatus)
        }
      });
    }

    // Send notifications
    if (notifications.length > 0) {
      await this.sendBulkNotifications(notifications);
    }
  }

  /**
   * Send board voting notification
   */
  async notifyBoardVoting(
    boardMembers: User[],
    requestTitle: string,
    homeownerName: string,
    dueDate?: string
  ): Promise<void> {
    const notifications: NotificationData[] = [];

    boardMembers.forEach(member => {
      // Email notification
      if (member.email) {
        notifications.push({
          type: 'email',
          recipient: member.email,
          template: 'board_voting_request',
          userId: member.id,
          data: {
            board_member_name: member.name,
            request_title: requestTitle,
            homeowner_name: homeownerName,
            due_date: dueDate,
            voting_url: `${window.location.origin}`,
            role: member.role
          }
        });
      }

      // SMS for urgent voting requests
      if (member.phone && dueDate) {
        notifications.push({
          type: 'sms',
          recipient: member.phone,
          template: 'board_voting_sms',
          userId: member.id,
          data: {
            board_member_name: member.name.split(' ')[0],
            request_title: requestTitle,
            due_date: dueDate
          }
        });
      }
    });

    if (notifications.length > 0) {
      await this.sendBulkNotifications(notifications);
    }
  }

  /**
   * Send neighbor approval notification
   */
  async notifyNeighborApproval(
    neighbors: Array<{ name: string; email?: string; phone?: string; address: string }>,
    requestTitle: string,
    homeownerName: string,
    homeownerAddress: string
  ): Promise<void> {
    const notifications: NotificationData[] = [];

    neighbors.forEach(neighbor => {
      // Email notification
      if (neighbor.email) {
        notifications.push({
          type: 'email',
          recipient: neighbor.email,
          template: 'neighbor_approval_request',
          data: {
            neighbor_name: neighbor.name,
            request_title: requestTitle,
            homeowner_name: homeownerName,
            homeowner_address: homeownerAddress,
            neighbor_address: neighbor.address,
            approval_url: `${window.location.origin}/neighbor-approval`
          }
        });
      }

      // SMS notification
      if (neighbor.phone) {
        notifications.push({
          type: 'sms',
          recipient: neighbor.phone,
          template: 'neighbor_approval_sms',
          data: {
            neighbor_name: neighbor.name.split(' ')[0],
            homeowner_name: homeownerName,
            request_title: requestTitle
          }
        });
      }
    });

    if (notifications.length > 0) {
      await this.sendBulkNotifications(notifications);
    }
  }

  /**
   * Send form distribution notification
   */
  async notifyFormDistribution(
    recipients: Array<{ name: string; email?: string; phone?: string }>,
    formTitle: string,
    dueDate?: string,
    isReminder = false
  ): Promise<void> {
    const notifications: NotificationData[] = [];

    recipients.forEach(recipient => {
      // Email notification
      if (recipient.email) {
        notifications.push({
          type: 'email',
          recipient: recipient.email,
          template: isReminder ? 'form_reminder' : 'form_distribution',
          data: {
            recipient_name: recipient.name,
            form_title: formTitle,
            due_date: dueDate,
            form_url: `${window.location.origin}/forms`,
            is_reminder: isReminder
          }
        });
      }

      // SMS for reminders or urgent forms
      if (recipient.phone && (isReminder || dueDate)) {
        notifications.push({
          type: 'sms',
          recipient: recipient.phone,
          template: isReminder ? 'form_reminder_sms' : 'form_distribution_sms',
          data: {
            recipient_name: recipient.name.split(' ')[0],
            form_title: formTitle,
            due_date: dueDate
          }
        });
      }
    });

    if (notifications.length > 0) {
      await this.sendBulkNotifications(notifications);
    }
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(status: string): string {
    const statusMessages: Record<string, string> = {
      'submitted': 'Your request has been submitted and is under review.',
      'cc_r_review': 'Your request is being reviewed for CC&R compliance.',
      'neighbor_approval': 'Your request is pending neighbor approval.',
      'board_review': 'Your request is being reviewed by the board.',
      'approved': 'Congratulations! Your request has been approved.',
      'rejected': 'Your request has been rejected. Please review the feedback.',
      'requires_changes': 'Your request requires changes before approval.',
      'cancelled': 'Your request has been cancelled.'
    };

    return statusMessages[status] || 'Your request status has been updated.';
  }

  /**
   * Get notification delivery statistics
   */
  async getDeliveryStats(filters?: {
    startDate?: string;
    endDate?: string;
    type?: 'email' | 'sms';
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.startDate) queryParams.append('startDate', filters.startDate);
      if (filters?.endDate) queryParams.append('endDate', filters.endDate);
      if (filters?.type) queryParams.append('type', filters.type);

      const response = await fetch(
        `${this.apiBaseUrl}/api/notifications/stats?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get delivery stats:', error);
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0
      };
    }
  }

  /**
   * Test notification configuration
   */
  async testNotification(type: 'email' | 'sms', recipient: string): Promise<NotificationResult> {
    return await this.sendNotification({
      type,
      recipient,
      template: 'test_notification',
      data: {
        test_message: 'This is a test notification from HOA Connect.',
        timestamp: new Date().toLocaleString()
      }
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

export default notificationService;
