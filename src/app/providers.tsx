// 📁 src/app/providers.tsx (UPDATED - Complete PWA integration)
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
import { PWAUpdateNotification } from '@/components/pwa/update-notification'
import { PWAUtils } from '@/lib/pwa-utils'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Don't retry if offline
          if (!navigator.onLine) return false
          return failureCount < 3
        },
      },
    },
  }))

  const initialize = useAuthStore(state => state.initialize)

  useEffect(() => {
    // Initialize auth when the app starts
    initialize()

    // Register service worker for PWA functionality
    PWAUtils.registerServiceWorker()

    // Request notification permission after a delay
    setTimeout(() => {
      PWAUtils.requestNotificationPermission()
    }, 5000)

    // Set up background sync for offline functionality
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register for background sync when app comes back online
        return registration.sync.register('background-sync')
      }).catch(err => {
        console.log('Background sync registration failed:', err)
      })
    }

    // Set up push notification handling
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Set up push notifications for app updates and important notifications
        registration.pushManager.getSubscription().then(subscription => {
          if (!subscription) {
            console.log('No push subscription found')
          } else {
            console.log('Push subscription active')
          }
        })
      })
    }

  }, [initialize])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        
        {/* PWA Components */}
        <PWAInstallPrompt />
        <OfflineIndicator />
        <PWAUpdateNotification />
      </QueryClientProvider>
    </ThemeProvider>
  )
}