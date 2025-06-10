// 📁 src/components/pwa/install-prompt.tsx (FIXED - Client-side checks)
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, X, Smartphone, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null)
  const [isClient, setIsClient] = useState(false) // FIXED: Add client-side flag

  useEffect(() => {
    // FIXED: Set client-side flag first
    setIsClient(true)
    
    // Check if already installed
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect platform
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios')
      } else if (/android/.test(userAgent)) {
        setPlatform('android')
      } else {
        setPlatform('desktop')
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ PWA installation accepted')
      } else {
        console.log('❌ PWA installation dismissed')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('PWA installation error:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // FIXED: Add client-side check before accessing sessionStorage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  // FIXED: Early return if not on client side
  if (!isClient) {
    return null
  }

  // FIXED: Add client-side check for sessionStorage
  const isDismissed = typeof window !== 'undefined' && window.sessionStorage 
    ? sessionStorage.getItem('pwa-install-dismissed') 
    : false

  // Don't show if already installed or user dismissed
  if (isInstalled || isDismissed) {
    return null
  }

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install SecurePass App',
          description: 'Add to your home screen for the best experience',
          steps: [
            'Tap the Share button in Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app'
          ]
        }
      case 'android':
        return {
          title: 'Install SecurePass App', 
          description: 'Get the full app experience',
          steps: [
            'Tap "Install App" below',
            'Confirm installation in the browser prompt',
            'Find the app on your home screen'
          ]
        }
      default:
        return {
          title: 'Install SecurePass App',
          description: 'Get desktop app experience with offline support',
          steps: [
            'Click "Install App" below',
            'Confirm installation in the browser prompt',
            'Launch from your applications folder'
          ]
        }
    }
  }

  const instructions = getInstallInstructions()

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="shadow-lg border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {platform === 'desktop' ? (
                    <Monitor className="h-5 w-5 text-primary" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-primary" />
                  )}
                  <CardTitle className="text-lg">{instructions.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>{instructions.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {platform === 'ios' ? (
                <div className="space-y-2">
                  {instructions.steps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <span className="flex-shrink-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Button 
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}