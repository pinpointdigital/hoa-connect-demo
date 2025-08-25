import React, { createContext, useContext, useState, useEffect } from 'react';
import { Request } from '../types';
// No preset demo request - start with clean slate
import { workflowEngine } from '../utils/workflowEngine';
import { notificationService } from '../services/notificationService';

interface DemoContextType {
  requests: Request[];
  addRequest: (request: Request) => void;
  updateRequest: (request: Request) => void;
  clearRequests: () => void;
  notifications: string[];
  addNotification: (message: string) => void;
  resetDemo: () => void;
  setRequestsDirectly: (requests: Request[]) => void;
  setNotificationsDirectly: (notifications: string[]) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: React.ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Send real notifications when status changes
  const sendStatusChangeNotification = async (request: Request, oldStatus: string, newStatus: string) => {
    try {
      // Get the actual user data from localStorage (demo users)
      const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      const homeowner = demoUsers.find((user: any) => user.id === request.homeownerId);
      
      if (!homeowner) {
        console.warn('Homeowner not found for notification:', request.homeownerId);
        return;
      }

      // Use contact info if available, otherwise fall back to main email/phone
      const contactEmail = homeowner.contactInfo?.email || homeowner.email;
      const contactPhone = homeowner.contactInfo?.phone || homeowner.phone;

      const homeownerForNotification = {
        id: homeowner.id,
        name: homeowner.name,
        email: contactEmail,
        phone: contactPhone,
        role: 'homeowner' as const,
        communityId: request.communityId || 'rancho-madrina'
      };

      await notificationService.notifyHomeownerStatusChange(
        homeownerForNotification,
        request.title,
        oldStatus,
        newStatus,
        {
          request_id: request.id,
          property_address: '123 Oak Street, Rancho Madrina Community',
          community_name: 'Rancho Madrina'
        }
      );

      console.log(`📧 Real notification sent: ${request.title} → ${newStatus}`);
    } catch (error) {
      console.error('Failed to send status change notification:', error);
    }
  };

  // Load requests from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('demo-shared-requests');
    if (stored) {
      try {
        const parsedRequests = JSON.parse(stored);
        setRequests(parsedRequests);
      } catch (error) {
        console.error('Error loading stored requests:', error);
      }
    }

    // Listen for storage changes (works across tabs/devices on same domain)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo-shared-requests' && e.newValue) {
        try {
          const newRequests = JSON.parse(e.newValue);
          setRequests(newRequests);
          
          // Add notification
          const latestRequest = newRequests[0];
          if (latestRequest) {
            addNotification(`New request: ${latestRequest.title}`);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage whenever requests change
  useEffect(() => {
    localStorage.setItem('demo-shared-requests', JSON.stringify(requests));
  }, [requests]);

  // Workflow processing - check for automatic transitions every few seconds
  useEffect(() => {
    const processWorkflow = () => {
      setRequests(prevRequests => {
        const processedRequests = workflowEngine.processRequests(prevRequests);
        
        // Check if any requests changed status
        const changedRequests = processedRequests.filter((processed, index) => 
          processed.status !== prevRequests[index]?.status
        );
        
        // Add notifications for workflow changes
        changedRequests.forEach(request => {
          const oldRequest = prevRequests.find(r => r.id === request.id);
          if (oldRequest && oldRequest.status !== request.status) {
            addNotification(`🔄 Workflow: ${request.title} → ${request.status.replace('_', ' ').toUpperCase()}`);
          }
        });
        
        return processedRequests;
      });
    };

    // Process workflow every 3 seconds for demo smoothness
    const interval = setInterval(processWorkflow, 3000);
    
    // Also process immediately on mount
    processWorkflow();
    
    return () => clearInterval(interval);
  }, []);

  const addRequest = async (request: Request) => {
    console.log('DemoContext: Adding request:', request.title);
    setRequests(prev => [request, ...prev.filter(r => r.id !== request.id)]);
    addNotification(`New request submitted: ${request.title}`);
    
    // Send notification to HOA management when new request is submitted
    try {
      const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      const homeowner = demoUsers.find((user: any) => user.id === request.homeownerId);
      const managementUser = demoUsers.find((user: any) => user.role === 'management');
      
      if (homeowner && managementUser) {
        // Use contact info if available
        const managementEmail = managementUser.contactInfo?.email || managementUser.email;
        const managementPhone = managementUser.contactInfo?.phone || managementUser.phone;
        
        const notifications = [];
        
        // Email notification to management
        if (managementEmail) {
          notifications.push({
            type: 'email' as const,
            recipient: managementEmail,
            template: 'new_request_submitted',
            data: {
              management_name: managementUser.name,
              homeowner_name: homeowner.name,
              request_title: request.title,
              request_type: request.type,
              property_address: '123 Oak Street, Rancho Madrina Community',
              community_name: 'Rancho Madrina',
              review_url: `${window.location.origin}/management/requests`,
              request_id: request.id
            }
          });
        }
        
        // SMS notification to management for urgent requests
        if (managementPhone && request.priority === 'high') {
          notifications.push({
            type: 'sms' as const,
            recipient: managementPhone,
            template: 'new_request_sms',
            data: {
              management_name: managementUser.name.split(' ')[0],
              homeowner_name: homeowner.name,
              request_title: request.title
            }
          });
        }
        
        // Send notifications
        if (notifications.length > 0) {
          await notificationService.sendBulkNotifications(notifications);
          console.log(`📧 Management notification sent for new request: ${request.title}`);
        }
      }
    } catch (error) {
      console.error('Failed to send new request notification:', error);
    }
  };

  const updateRequest = async (request: Request) => {
    console.log('DemoContext: Updating request:', request.title);
    
    // Get the old request for comparison
    const oldRequest = requests.find(r => r.id === request.id);
    
    // Process through workflow engine for automatic transitions
    const processedRequest = workflowEngine.processRequest(request);
    
    // Check if workflow caused a status change
    if (processedRequest.status !== request.status) {
      console.log(`Workflow transition: ${request.status} → ${processedRequest.status}`);
      addNotification(`🔄 Workflow: Request moved to ${processedRequest.status.replace('_', ' ').toUpperCase()} stage`);
    }
    
    // Send real notifications if status changed
    if (oldRequest && oldRequest.status !== processedRequest.status) {
      await sendStatusChangeNotification(processedRequest, oldRequest.status, processedRequest.status);
    }
    
    setRequests(prev => prev.map(r => r.id === request.id ? processedRequest : r));
    addNotification(`Request updated: ${processedRequest.title}`);
  };

  const clearRequests = () => {
    setRequests([]);
    setNotifications([]);
    localStorage.removeItem('demo-shared-requests');
  };

  const addNotification = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setNotifications(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  const resetDemo = () => {
    setRequests([]);
    setNotifications([]);
    localStorage.removeItem('demo-shared-requests');
  };

  const setRequestsDirectly = (newRequests: Request[]) => {
    setRequests(newRequests);
    localStorage.setItem('demo-shared-requests', JSON.stringify(newRequests));
  };

  const setNotificationsDirectly = (newNotifications: string[]) => {
    setNotifications(newNotifications);
  };

  return (
    <DemoContext.Provider value={{
      requests,
      addRequest,
      updateRequest,
      clearRequests,
      notifications,
      addNotification,
      resetDemo,
      setRequestsDirectly,
      setNotificationsDirectly
    }}>
      {children}
    </DemoContext.Provider>
  );
};
