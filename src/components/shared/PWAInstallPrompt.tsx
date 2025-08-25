import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react';
import { pwaManager } from '../../utils/pwa';

const PWAInstallPrompt: React.FC = () => {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if we should show install prompt
    const checkInstallPrompt = () => {
      // For demo purposes, show install prompt on mobile even without beforeinstallprompt
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      
      console.log('[PWA] Install check:', { isMobile, isStandalone, dismissed, canInstall: pwaManager.canInstall() });
      
      if (isMobile && !isStandalone && !dismissed) {
        // Show prompt after 5 seconds on mobile for demo
        console.log('[PWA] Will show mobile install prompt in 5 seconds');
        setTimeout(() => {
          console.log('[PWA] Showing mobile install prompt');
          setShowInstallPrompt(true);
        }, 5000);
      } else if (pwaManager.canInstall() && !dismissed) {
        // Original logic for desktop
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 30000);
      }
    };

    checkInstallPrompt();

    // Listen for PWA events
    const handleUpdateAvailable = () => {
      setShowUpdatePrompt(true);
    };

    const handleAppShortcut = (event: CustomEvent) => {
      console.log('[PWA] App shortcut used:', event.detail.action);
      // Handle specific shortcut actions
      switch (event.detail.action) {
        case 'submit-request':
          // Trigger request submission
          break;
        case 'view-requests':
          // Navigate to requests
          break;
        case 'notifications':
          // Open notifications
          break;
      }
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('app-shortcut', handleAppShortcut as EventListener);

    // Monitor network status
    const unsubscribeNetwork = pwaManager.onNetworkChange(setIsOnline);

    // Handle app shortcuts
    pwaManager.handleAppShortcut();

    // Preload critical resources
    pwaManager.preloadCriticalResources();

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('app-shortcut', handleAppShortcut as EventListener);
      unsubscribeNetwork();
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const installed = await pwaManager.installApp();
      if (installed) {
        setShowInstallPrompt(false);
        
        // Request notification permission after install
        await pwaManager.requestNotificationPermission();
        
        // Subscribe to push notifications
        await pwaManager.subscribeToPushNotifications();
      }
    } catch (error) {
      console.error('Failed to install app:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleUpdate = async () => {
    await pwaManager.updateApp();
    setShowUpdatePrompt(false);
  };

  const getDeviceIcon = () => {
    const userAgent = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      return <Smartphone className="w-8 h-8 text-primary-600" />;
    }
    return <Monitor className="w-8 h-8 text-primary-600" />;
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return {
        title: 'Install HOA Connect',
        steps: [
          'Tap the Share button in Safari',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install the app'
        ]
      };
    }
    
    if (/Android/i.test(userAgent)) {
      return {
        title: 'Install HOA Connect',
        steps: [
          'Tap "Install" when prompted',
          'Or tap the menu (⋮) and select "Install app"',
          'Follow the installation prompts'
        ]
      };
    }
    
    return {
      title: 'Install HOA Connect',
      steps: [
        'Click the install button in your browser',
        'Or look for the install icon in the address bar',
        'Follow the installation prompts'
      ]
    };
  };

  // Network status indicator
  const NetworkStatus = () => (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isOnline 
        ? 'bg-green-100 text-green-800 opacity-0 pointer-events-none' 
        : 'bg-red-100 text-red-800 opacity-100'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );

  return (
    <>
      <NetworkStatus />
      
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 transform transition-transform duration-300 ease-out">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getDeviceIcon()}
                <h3 className="text-lg font-semibold text-gray-900">
                  Install HOA Connect
                </h3>
              </div>
              <button
                onClick={handleDismissInstall}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Get the full app experience with faster loading, offline access, and push notifications.
            </p>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Works offline</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Push notifications</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Faster loading</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDismissInstall}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstall}
                disabled={isInstalling}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isInstalling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Install</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Manual install instructions for iOS */}
            {/iPhone|iPad|iPod/i.test(navigator.userAgent) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800 font-medium mb-2">
                  Manual Installation:
                </p>
                <ol className="text-xs text-blue-700 space-y-1">
                  {getInstallInstructions().steps.map((step, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="font-medium">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-50">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Download className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Update Available
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                A new version of HOA Connect is ready to install.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowUpdatePrompt(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Later
                </button>
                <button
                  onClick={handleUpdate}
                  className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700"
                >
                  Update
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowUpdatePrompt(false)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
