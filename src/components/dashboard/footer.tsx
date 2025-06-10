// 📁 src/components/dashboard/footer.tsx
'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  Wifi, 
  WifiOff, 
  Clock, 
  Download,
  Smartphone
} from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'
import { useAuth } from '@/hooks/useAuth'

export function DashboardFooter() {
  const { isOnline, isInstalled, canInstall, installPrompt } = usePWA()
  const { user } = useAuth()
  const [lastSync, setLastSync] = useState<Date>(new Date())

  // Update last sync time when going online
  useEffect(() => {
    if (isOnline) {
      setLastSync(new Date())
    }
  }, [isOnline])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleInstallPWA = () => {
    if (installPrompt) {
      installPrompt()
    }
  }

  return (
    <footer className="border-t bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        {/* Left: Connection status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">Offline</span>
              </>
            )}
          </div>
          
          {/* Last sync time */}
          <div className="hidden sm:flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Synced {formatTime(lastSync)}</span>
          </div>
        </div>

        {/* Center: App info (hidden on small screens) */}
        <div className="hidden md:flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">SecurePass Capsule</span>
          {isInstalled && (
            <Badge variant="outline" className="text-xs">
              <Smartphone className="h-3 w-3 mr-1" />
              PWA
            </Badge>
          )}
        </div>

        {/* Right: Status indicators & actions */}
        <div className="flex items-center space-x-2">
          {/* Security score */}
          {user?.securityScore && (
            <Badge variant="success" className="text-xs">
              {user.securityScore}% Secure
            </Badge>
          )}

          {/* PWA Install prompt */}
          {canInstall && !isInstalled && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleInstallPWA}
              className="text-xs h-7"
            >
              <Download className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Install App</span>
              <span className="sm:hidden">Install</span>
            </Button>
          )}

          {/* Version info (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <span className="text-xs text-muted-foreground">v1.0.0-dev</span>
          )}
        </div>
      </div>
    </footer>
  )
}