
// 📁 src/lib/pwa-utils.ts
export class PWAUtils {
  // Register service worker
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('✅ Service Worker registered:', registration.scope)
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New service worker installed, prompting for update')
                this.showUpdatePrompt()
              }
            })
          }
        })
        
        return registration
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  // Show update prompt
  static showUpdatePrompt() {
    if (confirm('A new version is available. Refresh to update?')) {
      window.location.reload()
    }
  }

  // Request notification permission
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  // Send push notification
  static async sendNotification(title: string, options?: NotificationOptions) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready
        return registration.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          vibrate: [100, 50, 100],
          ...options
        })
      }
    }
  }

  // Cache management
  static async clearCache() {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      console.log('🗑️ All caches cleared')
    }
  }

  // Check if app is installed
  static isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  // Get device type
  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile/.test(userAgent)) {
      return 'mobile'
    } else if (/tablet|ipad/.test(userAgent)) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }
}