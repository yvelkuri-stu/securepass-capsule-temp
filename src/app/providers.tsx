
// 📁 src/app/providers.tsx (UPDATED with PWA integration)
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator } from '@/components/pwa/offline-indicator'
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
  }, [initialize])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* PWA Components */}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </QueryClientProvider>
  )
}
