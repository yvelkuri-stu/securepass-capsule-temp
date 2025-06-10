// 📁 src/app/dashboard/layout.tsx (UPDATED with PWA awareness + footer)
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePWA } from '@/hooks/usePWA'
import { useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardFooter } from '@/components/dashboard/footer'
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
        
        {/* PWA Status Bar - Only show if offline and installed */}
        {isInstalled && !isOnline && (
          <div className="bg-amber-50 border-b px-6 py-2 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">
                You're offline. Some features may be limited.
              </span>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        <DashboardFooter />
      </div>
    </div>
  )
}