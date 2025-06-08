// 📁 src/app/auth/layout.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { redirectIfAuthenticated } = useAuth()

  useEffect(() => {
    redirectIfAuthenticated()
  }, [redirectIfAuthenticated])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
