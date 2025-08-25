import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDemoContext } from '../../contexts/DemoContext';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Users, 
  Vote, 
  AlertTriangle,
  MessageSquare,
  X,
  Eye,
  EyeOff,
  Filter,
  Calendar
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'neighbor_approval' | 'board_decision' | 'status_update' | 'form_required' | 'deadline_reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  urgent: boolean;
  actionRequired: boolean;
  relatedRequestId?: string;
  metadata?: {
    neighborName?: string;
    boardMember?: string;
    deadline?: string;
    formName?: string;
  };
}

interface NotificationCenterProps {
  onClose?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { requests } = useDemoContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Generate realistic notifications based on current request status
  useEffect(() => {
    const generateNotifications = () => {
      const currentRequest = requests[0]; // Jason's patio painting request
      const mockNotifications: Notification[] = [];

      if (currentRequest) {
        // Status-based notifications
        switch (currentRequest.status) {
          case 'submitted':
            mockNotifications.push({
              id: 'notif-1',
              type: 'status_update',
              title: 'Request Received',
              message: 'Your patio painting request has been received and is under initial review by Seabreeze Management.',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
              read: true,
              urgent: false,
              actionRequired: false,
              relatedRequestId: currentRequest.id
            });
            break;

          case 'cc_r_review':
            mockNotifications.push(
              {
                id: 'notif-1',
                type: 'status_update',
                title: 'Request Received',
                message: 'Your patio painting request has been received and is under initial review by Seabreeze Management.',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-2',
                type: 'status_update',
                title: 'Application Review Started',
                message: 'Allan Chua from Seabreeze Management has started reviewing your request for CC&R compliance.',
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              }
            );
            break;

          case 'neighbor_approval':
            mockNotifications.push(
              {
                id: 'notif-1',
                type: 'status_update',
                title: 'Request Received',
                message: 'Your patio painting request has been received and is under initial review by Seabreeze Management.',
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-2',
                type: 'status_update',
                title: 'Application Review Completed',
                message: 'Your request has been approved for neighbor notification. CC&R compliance confirmed.',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-3',
                type: 'neighbor_approval',
                title: 'Neighbor Notifications Sent',
                message: 'Your neighbors at 121 Oak St, 125 Oak St, and 124 Maple St have been notified and asked to approve your patio painting request.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id,
                metadata: {
                  deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
                }
              },
              {
                id: 'notif-4',
                type: 'neighbor_approval',
                title: 'Neighbor Approval Received',
                message: 'Robert Thompson (121 Oak St) has approved your patio painting request.',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id,
                metadata: {
                  neighborName: 'Robert Thompson'
                }
              }
            );
            break;

          case 'board_review':
            mockNotifications.push(
              {
                id: 'notif-1',
                type: 'status_update',
                title: 'Request Received',
                message: 'Your patio painting request has been received and is under initial review by Seabreeze Management.',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-2',
                type: 'neighbor_approval',
                title: 'All Neighbors Approved',
                message: 'Great news! All affected neighbors have approved your patio painting request.',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                read: true,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-3',
                type: 'status_update',
                title: 'Submitted to Board of Directors',
                message: 'Your request has been forwarded to the Board of Directors for final approval.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              },
              {
                id: 'notif-4',
                type: 'board_decision',
                title: 'Board Voting in Progress',
                message: 'The Board of Directors is currently voting on your patio painting request. You\'ll be notified once a decision is reached.',
                timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id,
                metadata: {
                  deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
                }
              }
            );
            break;

          case 'approved':
            mockNotifications.push(
              {
                id: 'notif-1',
                type: 'board_decision',
                title: '🎉 Request Approved!',
                message: 'Congratulations! The Board of Directors has approved your patio painting request. You may proceed with the sage green color as specified.',
                timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                read: false,
                urgent: true,
                actionRequired: false,
                relatedRequestId: currentRequest.id,
                metadata: {
                  boardMember: 'Robert Ferguson (Board President)'
                }
              },
              {
                id: 'notif-2',
                type: 'status_update',
                title: 'Next Steps',
                message: 'Please ensure you follow all approved specifications. Contact Seabreeze Management if you have any questions during your project.',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                read: false,
                urgent: false,
                actionRequired: false,
                relatedRequestId: currentRequest.id
              }
            );
            break;

          case 'rejected':
            mockNotifications.push(
              {
                id: 'notif-1',
                type: 'board_decision',
                title: 'Request Decision',
                message: 'The Board of Directors has reviewed your patio painting request. Please check your request details for the decision and any feedback.',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                read: false,
                urgent: true,
                actionRequired: true,
                relatedRequestId: currentRequest.id
              }
            );
            break;
        }
      }

      // Add some general notifications
      mockNotifications.push(
        {
          id: 'notif-form-1',
          type: 'form_required',
          title: 'Annual Form Required',
          message: 'Please complete your Owner Notice Disclosure form by September 15, 2024.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: false,
          urgent: true,
          actionRequired: true,
          metadata: {
            formName: 'Owner Notice Disclosure - 2025',
            deadline: '2024-09-15T23:59:59Z'
          }
        },
        {
          id: 'notif-community-1',
          type: 'status_update',
          title: 'Community Update',
          message: 'Pool maintenance scheduled for Tuesday, August 27th from 8 AM to 12 PM.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          read: true,
          urgent: false,
          actionRequired: false
        }
      );

      setNotifications(mockNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    };

    generateNotifications();
  }, [requests]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'neighbor_approval':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'board_decision':
        return <Vote className="w-5 h-5 text-purple-500" />;
      case 'status_update':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'form_required':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'deadline_reminder':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'urgent':
        return notif.urgent;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent).length;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">
                {unreadCount} unread • {urgentCount} urgent
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Filter className="w-5 h-5" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'urgent', label: 'Urgent', count: urgentCount }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-primary-500' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.urgent && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Urgent
                              </span>
                            )}
                            {notification.actionRequired && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Action Required
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${
                            !notification.read ? 'text-gray-700' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.metadata?.deadline && (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Deadline: {new Date(notification.metadata.deadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          {!notification.read ? (
                            <EyeOff className="w-4 h-4 text-primary-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
