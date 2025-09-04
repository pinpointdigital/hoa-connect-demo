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

  // Load requests from localStorage on mount - CRITICAL: This must run first
  useEffect(() => {
    console.log('🔄 DemoContext: MOUNTING - Loading from localStorage...');
    const stored = localStorage.getItem('demo-shared-requests');
    console.log('🔄 DemoContext: Raw localStorage value:', { stored, length: stored?.length });
    console.log('🔄 DemoContext: All localStorage keys:', Object.keys(localStorage));
    
    if (stored && stored !== 'null' && stored !== '[]') {
      try {
        const parsedRequests = JSON.parse(stored);
        console.log('🔄 DemoContext: Successfully parsed requests:', parsedRequests.length);
        console.log('🔄 DemoContext: Request details:', parsedRequests.map((r: any) => ({ 
          id: r.id, 
          title: r.title, 
          homeownerId: r.homeownerId,
          communityId: r.communityId 
        })));
        
        // CRITICAL: Set requests immediately and synchronously
        console.log('🔄 DemoContext: Setting requests state immediately...');
        setRequests(parsedRequests);
        console.log('🔄 DemoContext: Requests state set successfully');
      } catch (error) {
        console.error('🔄 DemoContext: ERROR parsing stored requests:', error);
        console.log('🔄 DemoContext: Corrupted data:', stored);
        // Don't set empty array on error - keep existing state
      }
    } else {
      console.log('🔄 DemoContext: No valid stored requests found (empty, null, or missing)');
      console.log('🔄 DemoContext: Checking for other request keys in localStorage...');
      Object.keys(localStorage).forEach(key => {
        if (key.includes('request') || key.includes('demo')) {
          console.log(`🔄 DemoContext: Found related key: ${key} = `, localStorage.getItem(key)?.substring(0, 100));
        }
      });
      // CRITICAL: Don't automatically set empty array - let it remain as initial state
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

  // Save to localStorage whenever requests change (except when already saved in addRequest)
  useEffect(() => {
    // CRITICAL: Don't save empty array on initial mount - this would overwrite existing data
    if (requests.length === 0) {
      console.log('🚫 DemoContext: Skipping save of empty requests array (likely initial mount)');
      return;
    }
    
    // Only save if this isn't from addRequest (which saves immediately)
    const currentStored = localStorage.getItem('demo-shared-requests');
    const storedRequests = currentStored ? JSON.parse(currentStored) : [];
    
    if (storedRequests.length !== requests.length) {
      console.log('💾 DemoContext: Saving to localStorage via useEffect:', requests.length, 'requests');
      localStorage.setItem('demo-shared-requests', JSON.stringify(requests));
    }
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
    console.log('DemoContext: Adding request:', request.title, 'ID:', request.id, 'CommunityID:', request.communityId);
    console.log('DemoContext: Current requests before adding:', requests.length);
    
    // CRITICAL: Save to localStorage IMMEDIATELY and SYNCHRONOUSLY
    const currentStored = localStorage.getItem('demo-shared-requests');
    const currentRequests = currentStored ? JSON.parse(currentStored) : [];
    const newRequests = [request, ...currentRequests.filter((r: any) => r.id !== request.id)];
    
    console.log('💾 DemoContext: SAVING immediately to localStorage:', newRequests.length, 'requests');
    console.log('💾 DemoContext: Request being saved:', { id: request.id, title: request.title, homeownerId: request.homeownerId });
    
    // Save with error handling
    try {
      localStorage.setItem('demo-shared-requests', JSON.stringify(newRequests));
      console.log('💾 DemoContext: localStorage.setItem completed successfully');
    } catch (error) {
      console.error('💾 DemoContext: ERROR saving to localStorage:', error);
    }
    
    // Verify it was saved
    const verification = localStorage.getItem('demo-shared-requests');
    console.log('💾 DemoContext: Verification - localStorage now contains:', verification ? JSON.parse(verification).length : 0, 'requests');
    
    // Double-check the specific request is in there
    if (verification) {
      const verifiedRequests = JSON.parse(verification);
      const foundRequest = verifiedRequests.find((r: any) => r.id === request.id);
      console.log('💾 DemoContext: New request found in verification:', foundRequest ? 'YES' : 'NO');
    }
    
    // Update React state
    setRequests(newRequests);
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
    console.log('💾 DemoContext: Updating request:', request.title, 'Status:', request.status);
    
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
    
    // CRITICAL: Save to localStorage IMMEDIATELY and SYNCHRONOUSLY (same as addRequest)
    const currentStored = localStorage.getItem('demo-shared-requests');
    const currentRequests = currentStored ? JSON.parse(currentStored) : [];
    const updatedRequests = currentRequests.map((r: any) => r.id === request.id ? processedRequest : r);
    
    console.log('💾 DemoContext: Saving updated request to localStorage immediately');
    console.log('💾 DemoContext: Updated request status:', processedRequest.status);
    
    try {
      localStorage.setItem('demo-shared-requests', JSON.stringify(updatedRequests));
      console.log('💾 DemoContext: localStorage.setItem completed successfully for update');
    } catch (error) {
      console.error('💾 DemoContext: ERROR saving updated request to localStorage:', error);
    }
    
    // Verify it was saved
    const verification = localStorage.getItem('demo-shared-requests');
    if (verification) {
      const verifiedRequests = JSON.parse(verification);
      const verifiedRequest = verifiedRequests.find((r: any) => r.id === request.id);
      console.log('💾 DemoContext: Updated request found in verification:', verifiedRequest ? 'YES' : 'NO');
      console.log('💾 DemoContext: Verified status:', verifiedRequest?.status);
    }
    
    // Update React state
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

  // Debug function - expose to window for console debugging and monitor localStorage
  React.useEffect(() => {
    (window as any).debugDemoContext = () => {
      console.log('=== DEMO CONTEXT DEBUG ===');
      console.log('Current requests in state:', requests.length);
      console.log('Requests:', requests.map((r: any) => ({ id: r.id, title: r.title, communityId: r.communityId })));
      console.log('localStorage demo-shared-requests:', localStorage.getItem('demo-shared-requests'));
      console.log('All localStorage keys:', Object.keys(localStorage));
      return {
        requestsInState: requests.length,
        requestsInLocalStorage: localStorage.getItem('demo-shared-requests'),
        allLocalStorageKeys: Object.keys(localStorage)
      };
    };

    // Monitor localStorage for any changes to our key
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;

    localStorage.setItem = function(key: string, value: string) {
      if (key === 'demo-shared-requests') {
        console.log('🔍 localStorage.setItem called for demo-shared-requests:', value.substring(0, 100));
        console.trace('🔍 Stack trace for localStorage.setItem');
      }
      return originalSetItem.call(this, key, value);
    };

    localStorage.removeItem = function(key: string) {
      if (key === 'demo-shared-requests') {
        console.log('🚨 localStorage.removeItem called for demo-shared-requests');
        console.trace('🚨 Stack trace for localStorage.removeItem');
      }
      return originalRemoveItem.call(this, key);
    };

    localStorage.clear = function() {
      console.log('🚨 localStorage.clear called - ALL DATA WILL BE LOST');
      console.trace('🚨 Stack trace for localStorage.clear');
      return originalClear.call(this);
    };

    // Cleanup function to restore original methods
    return () => {
      localStorage.setItem = originalSetItem;
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, [requests]);

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
