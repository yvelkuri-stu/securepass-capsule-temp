
// 📁 src/app/dashboard/layout.tsx (Mobile-responsive layout)
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { requireAuth, isAuthenticated } = useAuth()

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
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}