import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { getUserById } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  currentCommunity: string | null;
  login: (userId: string) => void;
  logout: () => void;
  switchRole: (userId: string) => void;
  switchCommunity: (communityId: string) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCommunity, setCurrentCommunity] = useState<string | null>(null);

  // Load community from localStorage on mount
  useEffect(() => {
    const storedCommunity = localStorage.getItem('hoa-connect-current-community');
    if (storedCommunity) {
      setCurrentCommunity(storedCommunity);
    } else {
      setCurrentCommunity('rancho-madrina'); // Default community
      localStorage.setItem('hoa-connect-current-community', 'rancho-madrina');
    }
  }, []);

  // Load user from localStorage on mount - BULLETPROOF VERSION
  useEffect(() => {
    const loadUserRobustly = () => {
      try {
        const storedUserId = localStorage.getItem('hoa-connect-demo-user');
        console.log('🔄 Loading stored user ID:', storedUserId);
        
        if (storedUserId) {
          // Try to load from localStorage first
      try {
        const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
            const storedUser = demoUsers.find((user: User) => user.id === storedUserId);
            
      if (storedUser) {
              console.log('✅ Loaded user from localStorage:', storedUser.name, storedUser.role);
        setCurrentUser(storedUser);
        return;
      }
          } catch (localStorageError) {
            console.warn('⚠️ Error loading from localStorage:', localStorageError);
          }
          
          // Fallback to mockData
          const mockUser = getUserById(storedUserId);
          if (mockUser) {
            console.log('✅ Loaded user from mockData:', mockUser.name, mockUser.role);
            setCurrentUser(mockUser);
            return;
          }
          
          console.warn('⚠️ User not found in localStorage or mockData:', storedUserId);
    }

    // Default to Allan Chua for demo (Management Dashboard)
        console.log('🔄 Loading default user (Allan Chua)');
        try {
          const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
          const fallbackStored = demoUsers.find((user: User) => user.id === 'allan-chua');
    const defaultUser = fallbackStored || getUserById('allan-chua');
          
    if (defaultUser) {
            console.log('✅ Loaded default user:', defaultUser.name, defaultUser.role);
      setCurrentUser(defaultUser);
      localStorage.setItem('hoa-connect-demo-user', defaultUser.id);
          } else {
            console.error('❌ Could not load default user');
          }
        } catch (error) {
          console.error('❌ Error loading default user:', error);
        }
      } catch (error) {
        console.error('❌ Critical error in user loading:', error);
      }
    };

    loadUserRobustly();
  }, []);

  const login = (userId: string) => {
    try {
      const demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      const storedUser = demoUsers.find((u: User) => u.id === userId);
      const user = storedUser || getUserById(userId);
      
      if (user) {
        console.log('Switching to user:', user.name, 'Role:', user.role);
        setCurrentUser(user);
        localStorage.setItem('hoa-connect-demo-user', userId);
      } else {
        console.error('User not found:', userId);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('hoa-connect-demo-user');
  };

  const switchRole = (userId: string) => {
    login(userId);
  };

  const switchCommunity = (communityId: string) => {
    setCurrentCommunity(communityId);
    localStorage.setItem('hoa-connect-current-community', communityId);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;

    try {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);

      // Update localStorage
      let demoUsers = [];
      try {
        demoUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      } catch (error) {
        console.error('Error parsing demo-users from localStorage:', error);
      }

      const userIndex = demoUsers.findIndex((u: User) => u.id === currentUser.id);
      if (userIndex >= 0) {
        demoUsers[userIndex] = updatedUser;
      } else {
        demoUsers.push(updatedUser);
      }
      
      localStorage.setItem('demo-users', JSON.stringify(demoUsers));
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    currentCommunity,
    login,
    logout,
    switchRole,
    switchCommunity,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Demo user selector component for presentations - matches screenshot functionality
export const DemoUserSelector: React.FC = () => {
  const { currentUser, login } = useAuth();
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = React.useState(true);

  // Helper function to get the correct dashboard route for a user
  const getDashboardRoute = (user: User): string => {
    switch (user.role) {
      case 'homeowner':
        return '/homeowner';
      case 'management':
        return '/management';
      case 'board_member':
        return '/board';
      default:
        return '/';
    }
  };
  const [currentMode, setCurrentMode] = React.useState('present');
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showSMSModal, setShowSMSModal] = React.useState(false);
  const [testEmailMessage, setTestEmailMessage] = React.useState('This is a test email from HOA Connect.');
  const [testSMSMessage, setTestSMSMessage] = React.useState('This is a test SMS from HOA Connect.');
  const [emailResult, setEmailResult] = React.useState<any>(null);
  const [smsResult, setSmsResult] = React.useState<any>(null);

  // State for user options to make them reactive
  const [userOptions, setUserOptions] = React.useState<Array<{id: string, name: string, role: string}>>([]);

  // Load user options on component mount and when needed
  const loadUserOptions = React.useCallback(() => {
    try {
      // Get users from localStorage first
      const storedUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
      
      // Get users from mockData as fallback
      const { DEMO_USERS } = require('../data/mockData');
      
      // Combine and deduplicate users (localStorage takes precedence)
      const allUsers = [...storedUsers];
      DEMO_USERS.forEach((mockUser: User) => {
        if (!allUsers.find(user => user.id === mockUser.id)) {
          allUsers.push(mockUser);
        }
      });
      
      // Filter to only include the specific users we want:
      // 1. Jason Abustan (Homeowner)
      // 2. Allan Chua (HOA Management) 
      // 3. Active Board Members from localStorage
      const filteredUsers = allUsers.filter((user: User) => {
        // Always include Jason (Homeowner)
        if (user.id === 'jason-abustan') return true;
        
        // Always include Allan (HOA Management)
        if (user.id === 'allan-chua') return true;
        
        // Include active board members (from localStorage or specific mock users)
        if (user.role === 'board_member') {
          // If user is in localStorage (active board members), include them
          const isInLocalStorage = storedUsers.some((stored: User) => stored.id === user.id);
          if (isInLocalStorage) return true;
          
          // If no board members in localStorage, include default mock board members
          const hasStoredBoardMembers = storedUsers.some((stored: User) => stored.role === 'board_member');
          if (!hasStoredBoardMembers) {
            // Include default board members: Robert Ferguson, Dean Martin, Frank Sinatra, David Kim, Patricia Williams
            return ['robert-ferguson', 'dean-martin', 'frank-sinatra', 'david-kim', 'patricia-williams'].includes(user.id);
          }
        }
        
        return false;
      });
      
      // Sort users by group: HOA Manager, Homeowner, Board of Directors
      const sortedUsers = filteredUsers.sort((a: User, b: User) => {
        // Group priority: management (1), homeowner (2), board_member (3)
        const getGroupPriority = (user: User) => {
          if (user.role === 'management') return 1;
          if (user.role === 'homeowner') return 2;
          if (user.role === 'board_member') return 3;
          return 4;
        };
        
        const aPriority = getGroupPriority(a);
        const bPriority = getGroupPriority(b);
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        // Within board members, sort by position hierarchy
        if (a.role === 'board_member' && b.role === 'board_member') {
          const getPositionPriority = (position?: string) => {
            if (position === 'president') return 1;
            if (position === 'vice_president') return 2;
            if (position === 'treasurer') return 3;
            if (position === 'secretary') return 4;
            return 5; // member
          };
          
          const aPos = getPositionPriority(a.boardMemberData?.position);
          const bPos = getPositionPriority(b.boardMemberData?.position);
          
          if (aPos !== bPos) {
            return aPos - bPos;
          }
        }
        
        // Finally sort by name
        return a.name.localeCompare(b.name);
      });
      
      // Format for dropdown
      const options = sortedUsers.map((user: User) => ({
        id: user.id,
        name: user.name,
        role: user.role === 'homeowner' ? 'Homeowner' : 
              user.role === 'management' ? 'HOA Management' :
              user.role === 'board_member' ? `Board ${user.boardMemberData?.position?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Member'}` :
              user.role
      }));
      
      console.log('Demo Switcher: Loaded user options:', options.map(o => `${o.name} (${o.role})`));
      setUserOptions(options);
      return options;
    } catch (error) {
      console.error('Error loading user options:', error);
      setUserOptions([]);
      return [];
    }
  }, []);

  // Load user options on mount and periodically refresh
  React.useEffect(() => {
    loadUserOptions();
    
    // Refresh user options periodically to detect board member changes
    const interval = setInterval(() => {
      loadUserOptions();
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(interval);
  }, [loadUserOptions]);

  // Listen for localStorage changes to detect user switches from other tabs/components
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hoa-connect-demo-user' && e.newValue !== e.oldValue) {
        console.log('🔄 Detected user change in localStorage:', e.oldValue, '->', e.newValue);
        console.log('🔄 Current localStorage keys before reload:', Object.keys(localStorage));
        console.log('🔄 Current demo-shared-requests before reload:', localStorage.getItem('demo-shared-requests')?.substring(0, 100));
        if (e.newValue) {
          // Reload user options and current user
          loadUserOptions();
          
          // Force page reload to ensure clean state
          setTimeout(() => {
            // Force localStorage to be written before reload
            const currentRequests = localStorage.getItem('demo-shared-requests');
            console.log('🔄 Pre-reload localStorage check:', currentRequests ? JSON.parse(currentRequests).length : 0, 'requests');
            console.log('🔄 Pre-reload ALL localStorage keys:', Object.keys(localStorage));
            console.log('🔄 Pre-reload demo-shared-requests content:', currentRequests?.substring(0, 200));
            window.location.reload();
          }, 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUserOptions]);

  const handleTestEmail = () => {
    setEmailResult(null);
    setShowEmailModal(true);
  };

  const sendTestEmail = async () => {
    if (!currentUser) return;

    try {
      // Import the notification service dynamically to avoid circular imports
      const { default: workflowNotificationService } = await import('../services/workflowNotificationService');
      
      const now = new Date();
      const subject = `HOA Connect Email Test [${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`;
      
      const result = await workflowNotificationService.sendTestEmail(currentUser, testEmailMessage, subject);
      
      setEmailResult({
        success: result.success,
        message: result.success ? 'Test email sent successfully!' : result.error,
        details: result.success ? {
          recipient: currentUser?.contactInfo?.email || currentUser?.email,
          subject,
          messageId: result.messageId
        } : null
      });
    } catch (error) {
      console.log('Test Email error:', error);
      setEmailResult({
        success: false,
        message: 'Backend service unavailable',
        details: null
      });
    }
  };

  const handleTestSMS = () => {
    setSmsResult(null);
    setShowSMSModal(true);
  };

  const sendTestSMS = async () => {
    if (!currentUser) return;

    try {
      // Import the notification service dynamically to avoid circular imports
      const { default: workflowNotificationService } = await import('../services/workflowNotificationService');
      
      const result = await workflowNotificationService.sendTestSMS(currentUser, testSMSMessage);
      
      setSmsResult({
        success: result.success,
        message: result.success ? 'Test SMS sent successfully!' : result.error,
        details: result.success ? {
          recipient: currentUser?.contactInfo?.phone || currentUser?.phone,
          messageId: result.messageId
        } : null
      });
    } catch (error) {
      console.log('Test SMS error:', error);
      setSmsResult({
        success: false,
        message: 'Backend service unavailable',
        details: null
      });
    }
  };

  const handleModeChange = (mode: string) => {
    setCurrentMode(mode);
    console.log('Mode changed to:', mode);
    
    if (mode === 'reset') {
      if (window.confirm('Are you sure you want to reset all demo data? This will clear all requests, notifications, and user data.')) {
        // Clear localStorage demo data
        localStorage.removeItem('demo-users');
        localStorage.removeItem('demo-requests');
        localStorage.removeItem('demo-notifications');
        alert('Demo data has been reset!');
        window.location.reload();
      }
    } else if (mode === 'develop') {
      alert('Developer mode activated!\n\nThis would enable debugging features and detailed logging.');
    } else if (mode === 'present') {
      alert('Presentation mode activated!\n\nThis would optimize the interface for demonstrations.');
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const getCurrentUserOption = () => {
    return userOptions.find(user => user.id === currentUser?.id);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {isMinimized ? (
        // Minimized state - small button to expand
        <button
          onClick={handleMinimize}
          className="bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-3 hover:bg-slate-700 transition-colors"
          title="Expand Demo Panel"
        >
          <div className="text-xs text-white">
            <div className="font-medium">{getCurrentUserOption()?.name || 'Demo User'}</div>
            <div className="text-slate-300">{getCurrentUserOption()?.role || 'Role'}</div>
          </div>
        </button>
      ) : (
        // Expanded state - full panel
        <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-600 p-4 min-w-[280px]">
          {/* Header with minimize button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Demo User:</h3>
            <button
              onClick={handleMinimize}
              className="text-slate-400 hover:text-white transition-colors"
              title="Minimize Demo Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            </div>

        {/* User Dropdown */}
        <div className="mb-6">
          <div className="relative">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                const newUserId = e.target.value;
                console.log('User selection changed to:', newUserId);
                
                if (newUserId && newUserId !== currentUser?.id) {
                  // Robust user switching without page reload
                  try {
                    // Get the new user data
                    const storedUsers = JSON.parse(localStorage.getItem('demo-users') || '[]');
                    const { getUserById } = require('../data/mockData');
                    const storedUser = storedUsers.find((u: User) => u.id === newUserId);
                    const newUser = storedUser || getUserById(newUserId);
                    
                    if (newUser) {
                      console.log('Switching to user:', newUser.name, 'Role:', newUser.role);
                      
                      // Update localStorage first
                      localStorage.setItem('hoa-connect-demo-user', newUserId);
                      
                      // Update current user state using login function
                      login(newUserId);
                      
                      // Navigate to the user's appropriate dashboard
                      const dashboardRoute = getDashboardRoute(newUser);
                      console.log('Navigating to:', dashboardRoute);
                      navigate(dashboardRoute);
                      
                      // Minimize the demo switcher after selection
                      setIsMinimized(true);
                    } else {
                      console.error('User not found:', newUserId);
                      alert('Error: User not found. Please try again.');
                    }
                  } catch (error) {
                    console.error('Error switching user:', error);
                    alert('Error switching user. Please try again.');
                  }
                }
              }}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

             {/* Test Notifications */}
             <div className="mb-6">
               <h4 className="text-slate-300 text-sm mb-3">Test Notifications</h4>
               <div className="flex space-x-2">
                 <button
                   onClick={handleTestEmail}
                   className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors active:bg-slate-500"
                   title="Send test email notification"
                 >
                   Email
                 </button>
          <button
                   onClick={handleTestSMS}
                   className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm transition-colors active:bg-slate-500"
                   title="Send test SMS notification"
                 >
                   SMS
          </button>
        </div>
             </div>

        {/* Mode Controls */}
        <div>
          <h4 className="text-slate-300 text-sm mb-3">Mode</h4>
          <div className="flex space-x-1">
            <button
              onClick={() => handleModeChange('present')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                currentMode === 'present' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title="Presentation mode"
            >
              Present
            </button>
            <button
              onClick={() => handleModeChange('develop')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                currentMode === 'develop' 
                  ? 'bg-slate-600 text-white' 
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title="Developer mode"
            >
              Develop
            </button>
            <button
              onClick={() => handleModeChange('reset')}
              className={`flex-1 px-3 py-2 rounded text-sm transition-colors ${
                currentMode === 'reset' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-700 hover:bg-red-600 text-white'
              }`}
              title="Reset all demo data"
            >
              Reset
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Email Test Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test Email</h3>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
            {!emailResult ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address:
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {currentUser?.contactInfo?.email || currentUser?.email}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Message:
                  </label>
                  <textarea
                    value={testEmailMessage}
                    onChange={(e) => setTestEmailMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter your test email message..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendTestEmail}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Send Test Email
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  {emailResult.success ? (
                    <div className="text-green-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Success!</h4>
                      <p className="text-sm text-gray-600 mt-2">{emailResult.message}</p>
                    </div>
                  ) : (
                    <div className="text-red-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Error</h4>
                      <p className="text-sm text-gray-600 mt-2">{emailResult.message}</p>
                    </div>
                  )}

                  {emailResult.success && emailResult.details && (
                    <div className="text-left bg-gray-50 p-4 rounded-md text-sm">
                      <div className="mb-2"><strong>Recipient:</strong> {emailResult.details.recipient}</div>
                      <div className="mb-2"><strong>Subject:</strong> {emailResult.details.subject}</div>
                      <div className="mb-2"><strong>Message:</strong> {testEmailMessage}</div>
                      <div><strong>Message ID:</strong> {emailResult.details.messageId}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowEmailModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SMS Test Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Test SMS</h3>
              <button
                onClick={() => setShowSMSModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!smsResult ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number:
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {currentUser?.contactInfo?.phone || currentUser?.phone}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Message:
                  </label>
                  <textarea
                    value={testSMSMessage}
                    onChange={(e) => setTestSMSMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter your test SMS message..."
                    maxLength={160}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {testSMSMessage.length}/160 characters
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSMSModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendTestSMS}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Send Test SMS
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  {smsResult.success ? (
                    <div className="text-green-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Success!</h4>
                      <p className="text-sm text-gray-600 mt-2">{smsResult.message}</p>
                    </div>
                  ) : (
                    <div className="text-red-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900">Error</h4>
                      <p className="text-sm text-gray-600 mt-2">{smsResult.message}</p>
                    </div>
                  )}

                  {smsResult.success && smsResult.details && (
                    <div className="text-left bg-gray-50 p-4 rounded-md text-sm">
                      <div className="mb-2"><strong>Recipient:</strong> {smsResult.details.recipient}</div>
                      <div className="mb-2"><strong>Message:</strong> {testSMSMessage}</div>
                      <div><strong>Message ID:</strong> {smsResult.details.messageId}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSMSModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
