// 📁 src/app/auth/layout.tsx (FIXED)
'use client'

import { AuthGuard } from '@/components/auth/auth-guard'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </AuthGuard>
  )
}
