
// 📁 src/hooks/usePWA.ts
'use client'

import { useState, useEffect } from 'react'

interface PWAHook {
  isInstalled: boolean
  isOnline: boolean
  canInstall: boolean
  installPrompt: (() => void) | null
  deferredPrompt: any
}

export function usePWA(): PWAHook {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPrompt = deferredPrompt ? async () => {
    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return choiceResult.outcome === 'accepted'
    } catch (error) {
      console.error('PWA install error:', error)
      return false
    }
  } : null

  return {
    isInstalled,
    isOnline,
    canInstall: !!deferredPrompt,
    installPrompt,
    deferredPrompt
  }
}
