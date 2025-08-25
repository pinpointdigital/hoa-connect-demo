// PWA utilities for HOA Connect

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled = false;
  private isStandalone = false;

  constructor() {
    this.init();
  }

  private init() {
    // In development, proactively unregister any existing service workers
    // to prevent stale JS from blocking new interactions (e.g., sidebar clicks).
    if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      const didAttemptKey = 'hoa-sw-unregister-attempted';
      const alreadyAttempted = localStorage.getItem(didAttemptKey) === 'true';
      if (!alreadyAttempted) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          if (regs.length > 0) {
            console.log('[PWA] Unregistering existing Service Workers in development...');
            Promise.all(regs.map((r) => r.unregister())).then(() => {
              localStorage.setItem(didAttemptKey, 'true');
              // Force a one-time reload so the page is controlled by the network
              window.location.reload();
            });
          }
        }).catch((err) => console.warn('[PWA] Failed to enumerate SW registrations:', err));
      }
    }

    // Check if app is running in standalone mode
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone ||
                       document.referrer.includes('android-app://');

    // Check if app is already installed
    this.isInstalled = this.isStandalone;

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      this.deferredPrompt = e;
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });

    // PWA disabled: do not register service worker
  }

  private async registerServiceWorker() {
    // Only register the service worker in production builds to avoid
    // development caching issues that can serve stale JavaScript and
    // break click handlers or UI updates during active development.
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Skipping Service Worker registration in development');
      return;
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[PWA] Service Worker registered successfully:', registration);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker available');
                this.showUpdateAvailable();
              }
            });
          }
        });

        // Check for updates every 30 minutes
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  public canInstall(): boolean {
    return !this.isInstalled && this.deferredPrompt !== null;
  }

  public isAppInstalled(): boolean {
    return this.isInstalled;
  }

  public isRunningStandalone(): boolean {
    return this.isStandalone;
  }

  public async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        this.deferredPrompt = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }

  private showUpdateAvailable() {
    // Show a notification that an update is available
    const event = new CustomEvent('pwa-update-available');
    window.dispatchEvent(event);
  }

  public async updateApp() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  // Offline storage utilities
  public async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0.0'
      });
      localStorage.setItem(`hoa-offline-${key}`, serializedData);
    } catch (error) {
      console.error('[PWA] Failed to store offline data:', error);
    }
  }

  public getOfflineData(key: string): any | null {
    try {
      const stored = localStorage.getItem(`hoa-offline-${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      
      // Check if data is too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > maxAge) {
        localStorage.removeItem(`hoa-offline-${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('[PWA] Failed to retrieve offline data:', error);
      return null;
    }
  }

  public clearOfflineData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('hoa-offline-')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Network status utilities
  public isOnline(): boolean {
    return navigator.onLine;
  }

  public onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Push notification utilities
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[PWA] This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  public async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('[PWA] Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_PUBLIC_KEY || ''
        )
      });

      console.log('[PWA] Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('[PWA] Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // App shortcuts handling
  public handleAppShortcut(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    if (action) {
      const event = new CustomEvent('app-shortcut', { detail: { action } });
      window.dispatchEvent(event);
    }
  }

  // Performance utilities
  public preloadCriticalResources(): void {
    const criticalResources = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.png') ? 'image' : 'fetch';
      document.head.appendChild(link);
    });
  }
}

// Create singleton instance
export const pwaManager = new PWAManager();

// Export utilities
export const {
  canInstall,
  isAppInstalled,
  isRunningStandalone,
  installApp,
  updateApp,
  storeOfflineData,
  getOfflineData,
  clearOfflineData,
  isOnline,
  onNetworkChange,
  requestNotificationPermission,
  subscribeToPushNotifications,
  handleAppShortcut,
  preloadCriticalResources
} = pwaManager;
