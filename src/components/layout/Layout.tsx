import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from './Navigation';
import { DemoUserSelector } from '../../contexts/AuthContext';
import { ConnectionStatus } from '../../contexts/SocketContext';
import NotificationToast, { ToastNotification } from '../shared/NotificationToast';
import DebugPanel from '../shared/DebugPanel';
import DemoResetPanel from '../shared/DemoResetPanel';
// PWA temporarily disabled; proactively unregister service workers below

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [showResetPanel, setShowResetPanel] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Function to remove notifications
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'R':
            e.preventDefault();
            setShowResetPanel(true);
            break;
          case 'r':
            e.preventDefault();
            setShowResetPanel(true);
            break;
          case 'D':
            e.preventDefault();
            setShowDebugPanel(!showDebugPanel);
            break;
          case 'd':
            e.preventDefault();
            setShowDebugPanel(!showDebugPanel);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Unregister any existing Service Workers and clear PWA caches
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
    }
    // Hide any previously stored install prompts
    try { localStorage.setItem('pwa-install-dismissed', 'true'); } catch {}
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">HOA Connect Demo</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-safe-top">
      {/* Demo Controls */}
      <DemoUserSelector />
      
      {/* Connection Status */}
      <ConnectionStatus />
      
      {/* Real-time Notifications */}
      <NotificationToast 
        notifications={notifications}
        onRemove={removeNotification}
      />
      
      {/* Debug Panel */}
      <DebugPanel 
        isOpen={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
      />
      
      {/* Demo Reset Panel */}
      <DemoResetPanel 
        isVisible={showResetPanel} 
        onClose={() => setShowResetPanel(false)} 
      />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
