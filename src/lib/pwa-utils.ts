// 📁 src/lib/pwa-utils.ts (FIXED - Client-side checks and update prompt handler)

// Define a local interface that extends NotificationOptions to include 'vibrate'
// This is a workaround if the global NotificationOptions type is missing this property.
interface CustomNotificationOptions extends NotificationOptions {
  vibrate?: number[] | number;
}

export class PWAUtils {
  // A static property to hold the function that will handle update prompts
  private static updatePromptHandler: (() => void) | null = null;

  /**
   * Sets a callback function to be called when a new service worker is installed
   * and ready to activate, prompting the user for an update.
   * This allows the UI layer to display a custom prompt (e.g., a toast or modal).
   * @param handler A function to be called when an update is available. Pass `null` to clear.
   */
  static setUpdatePromptHandler(handler: (() => void) | null) {
    PWAUtils.updatePromptHandler = handler;
  }

  // Register service worker
  static async registerServiceWorker() {
    // Ensure we are in a client-side environment with service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker API not available in this environment.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            // New service worker has installed and is waiting to activate
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker installed, signaling for update prompt');
              // Call the registered update prompt handler, if any
              if (PWAUtils.updatePromptHandler) {
                PWAUtils.updatePromptHandler();
              } else {
                
                console.warn('PWAUtils: No custom update prompt handler set. User will not be prompted for update.');
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // This method is now deprecated. The update prompt logic is handled via `setUpdatePromptHandler`.
  static showUpdatePrompt() {
    console.warn('PWAUtils.showUpdatePrompt() is deprecated. Please use PWAUtils.setUpdatePromptHandler() and handle the prompt in your UI component.');
    if (PWAUtils.updatePromptHandler) {
        PWAUtils.updatePromptHandler();
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Send push notification
  static async sendNotification(title: string, options?: CustomNotificationOptions) {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
      console.warn('Notification or Service Worker API not available.');
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      return registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100], // Now 'vibrate' is a known property in CustomNotificationOptions
        ...options
      });
    }
  }

  // Cache management
  static async clearCache() {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return;
    }

    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ All caches cleared');
  }

  // Check if app is installed
  static isInstalled(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for PWA installation status
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
           ((window.navigator as any).standalone === true); // For iOS Safari
  }

  // Get device type
  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof navigator === 'undefined') {
      return 'desktop'; // Default for SSR
    }

    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|iemobile/.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
}
