// 📁 src/components/pwa/offline-indicator.tsx (FIXED - Client-side checks)
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showIndicator, setShowIndicator] = useState(false)
  const [isClient, setIsClient] = useState(false) // FIXED: Add client-side flag

  useEffect(() => {
    // FIXED: Set client-side flag first
    setIsClient(true)
    
    const updateOnlineStatus = () => {
      if (typeof navigator !== 'undefined') {
        const online = navigator.onLine
        setIsOnline(online)
        
        if (!online) {
          setShowIndicator(true)
        } else {
          // Hide indicator after a brief "back online" message
          setTimeout(() => setShowIndicator(false), 3000)
        }
      }
    }

    // Set initial status only on client side
    if (typeof navigator !== 'undefined') {
      updateOnlineStatus()

      // Listen for online/offline events
      window.addEventListener('online', updateOnlineStatus)
      window.addEventListener('offline', updateOnlineStatus)

      return () => {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
      }
    }
  }, [])

  // FIXED: Don't render anything on server side
  if (!isClient) {
    return null
  }

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Badge 
            variant={isOnline ? 'default' : 'destructive'}
            className="px-3 py-2 shadow-lg"
          >
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Back Online
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Offline Mode
              </>
            )}
          </Badge>
        </motion.div>
      )}
    </AnimatePresence>
  )
}