
// 📁 src/app/dashboard/layout.tsx (UPDATED with PWA awareness)
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePWA } from '@/hooks/usePWA'
import { useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Badge } from '@/components/ui/badge'
import { WifiOff } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { requireAuth, isAuthenticated } = useAuth()
  const { isOnline, isInstalled } = usePWA()

  useEffect(() => {
    requireAuth()
  }, [requireAuth])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        {/* PWA Status Bar */}
        {isInstalled && (
          <div className="bg-primary/5 border-b px-6 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                📱 PWA Mode
              </Badge>
              {!isOnline && (
                <Badge variant="destructive" className="text-xs">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
