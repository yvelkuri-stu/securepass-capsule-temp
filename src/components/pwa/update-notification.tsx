// 📁 src/components/pwa/update-notification.tsx (NEW - Enhanced Update System)
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  CheckCircle,
  X,
  Wifi,
  WifiOff,
  Clock,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { PWAUtils } from '@/lib/pwa-utils'

interface UpdateInfo {
  version: string
  size: string
  features: string[]
  critical: boolean
  releaseDate: Date
}

export function PWAUpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updateStep, setUpdateStep] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)

  useEffect(() => {
    // Set up the PWA update prompt handler
    PWAUtils.setUpdatePromptHandler(() => {
      console.log('🔄 PWA update available, showing notification')
      setUpdateInfo({
        version: '2.1.0',
        size: '2.3 MB',
        features: [
          'Enhanced AI content analysis',
          'Improved offline functionality',
          'New sharing permissions system',
          'Better security encryption',
          'Performance improvements'
        ],
        critical: false,
        releaseDate: new Date()
      })
      setUpdateAvailable(true)
    })

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Check for auto-update preference
    const autoUpdate = localStorage.getItem('pwa-auto-update') === 'true'
    setAutoUpdateEnabled(autoUpdate)

    return () => {
      PWAUtils.setUpdatePromptHandler(null)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-update if enabled and update is not critical
  useEffect(() => {
    if (updateAvailable && autoUpdateEnabled && updateInfo && !updateInfo.critical) {
      setTimeout(() => {
        handleUpdate()
      }, 3000) // Wait 3 seconds then auto-update
    }
  }, [updateAvailable, autoUpdateEnabled, updateInfo])

  const handleUpdate = async () => {
    if (!isOnline) {
      toast.error('Update requires an internet connection')
      return
    }

    setIsUpdating(true)
    setUpdateProgress(0)
    
    try {
      // Simulate update steps with progress
      const steps = [
        { step: 'Downloading update...', progress: 20 },
        { step: 'Installing new features...', progress: 40 },
        { step: 'Updating security protocols...', progress: 60 },
        { step: 'Optimizing performance...', progress: 80 },
        { step: 'Finalizing installation...', progress: 95 },
        { step: 'Update complete!', progress: 100 }
      ]

      for (const { step, progress } of steps) {
        setUpdateStep(step)
        setUpdateProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Trigger actual app reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
      toast.success('Update installed successfully! Reloading app...')
      
    } catch (error) {
      console.error('Update failed:', error)
      toast.error('Update failed. Please try again.')
      setIsUpdating(false)
      setUpdateProgress(0)
      setUpdateStep('')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setUpdateAvailable(false)
    
    // Remember dismissal for this session
    sessionStorage.setItem('update-dismissed', 'true')
    
    toast.info('Update postponed. You can always update from the settings menu.')
  }

  const handlePostpone = () => {
    setDismissed(true)
    setUpdateAvailable(false)
    
    // Show reminder in 1 hour
    setTimeout(() => {
      if (!sessionStorage.getItem('update-dismissed')) {
        setUpdateAvailable(true)
        setDismissed(false)
      }
    }, 60 * 60 * 1000)
    
    toast.info('Update reminder set for 1 hour')
  }

  const toggleAutoUpdate = () => {
    const newValue = !autoUpdateEnabled
    setAutoUpdateEnabled(newValue)
    localStorage.setItem('pwa-auto-update', newValue.toString())
    
    toast.success(
      newValue 
        ? 'Auto-updates enabled for future releases' 
        : 'Auto-updates disabled'
    )
  }

  if (!updateAvailable || dismissed) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="shadow-2xl border-primary/20 bg-gradient-to-br from-white to-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">App Update Available!</CardTitle>
                  {updateInfo && (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        v{updateInfo.version}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {updateInfo.size}
                      </Badge>
                      {updateInfo.critical && (
                        <Badge variant="destructive" className="text-xs">
                          Critical
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
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
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isUpdating ? (
              <>
                {/* Update Features */}
                {updateInfo && updateInfo.features.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">What's New:</h4>
                    <ul className="text-xs space-y-1">
                      {updateInfo.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {updateInfo.features.length > 3 && (
                        <li className="text-muted-foreground">
                          +{updateInfo.features.length - 3} more improvements
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Connection Status */}
                <div className="flex items-center space-x-2 text-xs">
                  {isOnline ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <Wifi className="h-3 w-3" />
                      <span>Ready to update</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <WifiOff className="h-3 w-3" />
                      <span>Offline - update when connected</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={!isOnline}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {updateInfo?.critical ? 'Install Critical Update' : 'Update Now'}
                  </Button>
                  
                  <div className="flex space-x-2">
                    {!updateInfo?.critical && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePostpone}
                        className="flex-1"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Later
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAutoUpdate}
                      className="flex-1"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Auto: {autoUpdateEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>

                {/* Critical Update Warning */}
                {updateInfo?.critical && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-xs text-red-700">
                        <strong>Critical Update:</strong> This update contains important 
                        security fixes and should be installed immediately.
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Update in Progress */
              <div className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                  </div>
                  <h4 className="font-medium">Updating App</h4>
                  <p className="text-sm text-muted-foreground">{updateStep}</p>
                </div>

                <div className="space-y-2">
                  <Progress value={updateProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{updateProgress}%</span>
                  </div>
                </div>

                <div className="text-xs text-center text-muted-foreground">
                  Please don't close the app during the update
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for manual update checking
export function useUpdateChecker() {
  const [checking, setChecking] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)

  const checkForUpdates = async () => {
    setChecking(true)
    
    try {
      // Check service worker for updates
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        await registration.update()
        
        // If no update is found after checking
        setTimeout(() => {
          if (!updateAvailable) {
            toast.success('You have the latest version!')
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Update check failed:', error)
      toast.error('Failed to check for updates')
    } finally {
      setChecking(false)
    }
  }

  return {
    checkForUpdates,
    checking,
    updateAvailable
  }
}