import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserProfile from '../shared/UserProfile';
import CompanyLogo from '../shared/CompanyLogo';
import { 
  Home, 
  FileText, 
  Users, 
  Bell, 
  Menu, 
  X,
  Building,
  Vote,
  ClipboardList,
  UserCheck,
  Megaphone,
  User,
  Edit3
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showUserProfile, setShowUserProfile] = useState(false);

  // Keyboard shortcut: Cmd/Ctrl + P opens profile
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const metaPressed = isMac ? e.metaKey : e.ctrlKey;
      if (metaPressed && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setShowUserProfile(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);



  if (!currentUser) return null;

  const getNavigationItems = () => {
    switch (currentUser.role) {
      case 'homeowner':
        return [
          { name: 'Dashboard', href: '/homeowner', icon: Home },
          { name: 'Submit Request', href: '/homeowner/submit', icon: FileText },
          { name: 'My Requests', href: '/homeowner/requests', icon: ClipboardList },
          { name: 'Forms', href: '/homeowner/forms', icon: FileText },
          { name: 'Notifications', href: '/homeowner/notifications', icon: Bell },
        ];
      case 'management':
        return [
          { name: 'Dashboard', href: '/management', icon: Home },
          { name: 'Requests', href: '/management/requests', icon: ClipboardList },
          { name: 'Communications Center', href: '/management/forms', icon: Megaphone },
          { name: 'Communities', href: '/management/communities', icon: Building },
          { name: 'Notifications', href: '/management/notifications', icon: Bell },
        ];
      case 'board_member':
        return [
          { name: 'Dashboard', href: '/board', icon: Home },
          { name: 'Pending Votes', href: '/board/votes', icon: Vote },
          { name: 'Discussions', href: '/board/discussions', icon: Users },
          { name: 'Request History', href: '/board/history', icon: ClipboardList },
          { name: 'Notifications', href: '/board/notifications', icon: Bell },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleDisplayName = () => {
    switch (currentUser.role) {
      case 'homeowner':
        return 'Homeowner Portal';
      case 'management':
        return 'Management Dashboard';
      case 'board_member':
        return 'Board Member Portal';
      default:
        return 'HOA Connect';
    }
  };

  const getRoleColor = () => {
    switch (currentUser.role) {
      case 'homeowner':
        return 'bg-primary-600';
      case 'management':
        return 'bg-seabreeze-600';
      case 'board_member':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <>
      {/* Mobile/Tablet menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm pt-safe-top">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="flex flex-col items-center space-y-1">
              <div className="w-20 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200">
                <CompanyLogo type="square" size="md" />
              </div>
              <div className="text-center">
                <h1 className="text-sm font-semibold text-gray-900 leading-tight">HOA Connect</h1>
                <p className="text-xs text-gray-500 leading-tight">{getRoleDisplayName()}</p>
              </div>
            </div>
          </div>
          <div className="w-8"></div> {/* Spacer for demo user selector */}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 xl:pt-16 pt-safe-top pb-4 overflow-y-auto">
          {/* Logo and title */}
          <div className="flex flex-shrink-0 px-4 py-3 items-center">
            <div className="mr-3">
              <CompanyLogo type="square" size="md" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">HOA Connect</h1>
              <p className="text-sm text-gray-500 leading-tight">{getRoleDisplayName()}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                >
                  <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                  {item.name}
                </a>
              );
            })}
          </nav>

          {/* User Profile Section */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowUserProfile(true);
              }}
              className="w-full flex items-center text-left text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-lg p-3 transition-all duration-200 group"
              title="Click to edit profile and contact information"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 group-hover:bg-blue-200 mr-3 transition-colors flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-14 h-14 object-cover" />
                ) : (
                  <User className="w-7 h-7 text-blue-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate group-hover:text-blue-900">{currentUser.name}</p>
                <p className="text-xs text-gray-500 capitalize group-hover:text-blue-700">{currentUser.role.replace('_', ' ')}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-4 h-4 text-blue-600" />
              </div>
            </button>
            
            {/* Community info */}
            <div className="text-xs text-gray-500 mt-3 px-2">
              <p className="font-medium">Rancho Madrina Community</p>
              <p>Managed by Seabreeze</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet menu overlay */}
      {isMobileMenuOpen && (
        <div className="xl:hidden">
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              
              {/* Mobile menu content */}
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <div className={`w-8 h-8 ${getRoleColor()} rounded-lg flex items-center justify-center`}>
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <h1 className="text-lg font-bold text-gray-900">HOA Connect</h1>
                    <p className="text-sm text-gray-500">{getRoleDisplayName()}</p>
                  </div>
                </div>
                
                <nav className="mt-5 px-2 space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="mr-4 flex-shrink-0 h-6 w-6" />
                        {item.name}
                      </a>
                    );
                  })}
                </nav>
              </div>
              
              <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUserProfile(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center text-left text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-200 border border-transparent rounded-lg p-3 transition-all duration-200 group"
                  title="Click to edit profile and contact information"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-blue-100 group-hover:bg-blue-200 mr-3 transition-colors flex items-center justify-center">
                    {currentUser?.avatar ? (
                      <img src={currentUser.avatar} alt="Avatar" className="w-14 h-14 object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate group-hover:text-blue-900">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 capitalize group-hover:text-blue-700">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-4 h-4 text-blue-600" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}
      

    </>
  );
};

export default Navigation;
