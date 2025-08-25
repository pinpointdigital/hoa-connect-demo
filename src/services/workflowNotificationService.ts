import { Request, User } from '../types';

const API_BASE_URL = 'http://localhost:3001';

interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
  results?: any[];
}

class WorkflowNotificationService {
  /**
   * Send test email notification (for demo switcher)
   */
  async sendTestEmail(user: User, customMessage?: string, customSubject?: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.contactInfo?.email || user.email,
          userName: user.name,
          customMessage: customMessage || 'This is a test email from HOA Connect.',
          customSubject: customSubject || 'HOA Connect Email Test',
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Test email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email'
      };
    }
  }

  /**
   * Send test SMS notification (for demo switcher)
   */
  async sendTestSMS(user: User, customMessage?: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userPhone: user.contactInfo?.phone || user.phone,
          userName: user.name,
          customMessage: customMessage || 'This is a test SMS from HOA Connect.',
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Test SMS error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test SMS'
      };
    }
  }

  /**
   * Send request submitted notification to homeowner
   */
  async notifyRequestSubmitted(request: Request, homeowner: User): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/request-submitted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          homeownerId: homeowner.id,
          homeownerEmail: homeowner.contactInfo?.email || homeowner.email,
          requestTitle: request.title,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Request submitted notification error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send management review notification
   */
  async notifyManagementReview(request: Request, homeowner: User, managementUser: User): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/management-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          managementEmail: managementUser.contactInfo?.email || managementUser.email,
          homeownerName: homeowner.name,
          requestTitle: request.title,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Management review notification error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send neighbor approval notifications
   */
  async notifyNeighborApproval(request: Request, homeowner: User, neighbors: User[]): Promise<NotificationResponse> {
    try {
      const neighborEmails = neighbors
        .map(neighbor => neighbor.contactInfo?.email || neighbor.email)
        .filter(email => email);

      const response = await fetch(`${API_BASE_URL}/api/notifications/neighbor-approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          neighborEmails,
          homeownerName: homeowner.name,
          requestTitle: request.title,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Neighbor approval notification error:', error);
      return { success: false, error: 'Failed to send notifications' };
    }
  }

  /**
   * Send board voting notifications
   */
  async notifyBoardVoting(request: Request, homeowner: User, boardMembers: User[]): Promise<NotificationResponse> {
    try {
      const boardMemberEmails = boardMembers
        .map(member => member.contactInfo?.email || member.email)
        .filter(email => email);

      const response = await fetch(`${API_BASE_URL}/api/notifications/board-voting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          boardMemberEmails,
          homeownerName: homeowner.name,
          requestTitle: request.title,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Board voting notification error:', error);
      return { success: false, error: 'Failed to send notifications' };
    }
  }

  /**
   * Send final decision notification to homeowner
   */
  async notifyFinalDecision(request: Request, homeowner: User, decision: 'approved' | 'rejected'): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/final-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          homeownerEmail: homeowner.contactInfo?.email || homeowner.email,
          homeownerName: homeowner.name,
          requestTitle: request.title,
          decision,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Final decision notification error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send general notification using the existing endpoint
   */
  async sendNotification(notification: {
    type: 'email' | 'sms';
    recipient: string;
    template: string;
    data?: any;
    metadata?: any;
  }): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      return await response.json();
    } catch (error) {
      console.error('General notification error:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }
}

export default new WorkflowNotificationService();
