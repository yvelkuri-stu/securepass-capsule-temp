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
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )
  
  const [mounted, setMounted] = useState(false)
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    setMounted(true)
    
    // Initialize auth store
    initialize()

    // Initialize PWA features with delay to avoid preload warning
    const initPWA = async () => {
      // Wait for page to fully load before initializing PWA
      if (document.readyState === 'complete') {
        await PWAUtils.initialize()
      } else {
        window.addEventListener('load', () => {
          // Additional delay to ensure everything is settled
          setTimeout(() => {
            PWAUtils.initialize()
          }, 500)
        })
      }
    }

    initPWA()
  }, [initialize])

  // Don't render anything on server or before mounting
  if (!mounted) {
    return null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        
        {/* PWA Components */}
        <PWAInstallPrompt />
        <OfflineIndicator />
        <PWAUpdateNotification />
      </ThemeProvider>
    </QueryClientProvider>
  )
}