// 📁 src/lib/pwa-utils.ts (FIXED - Client-side checks and update prompt handler)
interface CustomNotificationOptions extends NotificationOptions {
  vibrate?: number[] | number;
}

export class PWAUtils {
  private static updatePromptHandler: (() => void) | null = null

  static setUpdatePromptHandler(handler: (() => void) | null) {
    this.updatePromptHandler = handler
  }

  static async registerServiceWorker() {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      try {
        // Register service worker without preloading
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('Service Worker registered successfully:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                this.showUpdatePrompt()
              }
            })
          }
        })

        // Handle waiting service worker
        if (registration.waiting) {
          this.showUpdatePrompt()
        }

        return registration
      } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
      }
    }
    return null
  }

  static showUpdatePrompt() {
    if (this.updatePromptHandler) {
      this.updatePromptHandler()
    }
  }

  static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  static async sendNotification(title: string, options?: CustomNotificationOptions) {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    if (Notification.permission !== 'granted') {
      const granted = await this.requestNotificationPermission()
      if (!granted) {
        console.warn('Notification permission not granted')
        return
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'securepass-notification',
        renotify: true,
        requireInteraction: false,
        ...options,
      })

      // Auto-close after 5 seconds if not clicked
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  static async clearCache() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('All caches cleared')
      } catch (error) {
        console.error('Error clearing caches:', error)
      }
    }
  }

  static isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check if app is installed
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      // @ts-ignore
      window.navigator.standalone === true
    )
  }

  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop'
    
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
    const isTablet = /ipad|android(?!.*mobile)/.test(userAgent) || 
                    (window.innerWidth >= 768 && window.innerWidth <= 1024)
    
    if (isMobile && !isTablet) return 'mobile'
    if (isTablet) return 'tablet'
    return 'desktop'
  }

  // Initialize PWA features
  static async initialize() {
    if (typeof window === 'undefined') return

    // Register service worker
    await this.registerServiceWorker()

    // Request notification permission on user interaction
    document.addEventListener('click', async () => {
      await this.requestNotificationPermission()
    }, { once: true })

    // Handle app installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      // Store the event for later use
      window.deferredPrompt = e
    })

    // Handle app installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      window.deferredPrompt = null
    })
  }
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      PWAUtils.initialize()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      PWAUtils.initialize()
    }, 1000)
  }
}