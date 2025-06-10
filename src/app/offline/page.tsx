// 📁 src/app/offline/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WifiOff, RefreshCw, Shield, Archive, Eye, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCapsuleStore } from '@/store/capsules'
import Link from 'next/link'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const { capsules, unlockedCapsules } = useCapsuleStore()

  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    checkOnlineStatus()
    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)

    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    if (navigator.onLine) {
      window.location.href = '/dashboard'
    }
  }

  const offlineCapsules = capsules.filter(c => !c.isEncrypted || unlockedCapsules.has(c.id))

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Offline Status */}
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <WifiOff className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <CardDescription>
              No internet connection detected. You can still access some cached content.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Connection Restored' : 'Offline Mode'}
              </Badge>
              {retryCount > 0 && (
                <Badge variant="outline">
                  {retryCount} attempt{retryCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              {isOnline ? 'Go Back Online' : 'Retry Connection'}
            </Button>

            {isOnline && (
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Available Offline Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="h-5 w-5 mr-2" />
              Available Offline
            </CardTitle>
            <CardDescription>
              Content you can access without an internet connection
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {offlineCapsules.length > 0 ? (
              <div className="space-y-3">
                {offlineCapsules.slice(0, 5).map((capsule) => (
                  <div key={capsule.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{capsule.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {unlockedCapsules.has(capsule.id) ? 'Unlocked & cached' : 'Available offline'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" disabled>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {offlineCapsules.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{offlineCapsules.length - 5} more capsules available offline
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No content cached for offline access</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visit capsules while online to cache them for offline use
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle>What You Can Do Offline</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>View cached capsules</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Access unlocked content</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Queue actions for sync</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Browse app interface</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Create new capsules</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Upload files</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">💡 Offline Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Unlock capsules while online to access them offline</li>
                  <li>• Changes made offline will sync when you reconnect</li>
                  <li>• Your data remains encrypted and secure offline</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}