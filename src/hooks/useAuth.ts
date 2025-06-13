// 📁 src/hooks/useAuth.ts (FIXED - Proper redirect logic)
'use client'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'

export function useAuth() {
  const auth = useAuthStore()
  const router = useRouter()

  // Auto-redirect logic with better conditions
  useEffect(() => {
    // Only redirect if we're not currently loading and have a clear auth state
    if (!auth.isLoading) {
      const currentPath = window.location.pathname
      
      if (auth.isAuthenticated && auth.user) {
        // User is authenticated - redirect away from auth pages
        if (currentPath.startsWith('/auth/') || currentPath === '/') {
          console.log('✅ User authenticated, redirecting to dashboard')
          router.push('/dashboard')
        }
      } else {
        // User is not authenticated - redirect to login if on protected pages
        if (currentPath.startsWith('/dashboard')) {
          console.log('❌ User not authenticated, redirecting to login')
          router.push('/auth/login')
        }
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, auth.user, router])

  const requireAuth = useCallback(() => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      router.push('/auth/login')
    }
  }, [auth.isAuthenticated, auth.isLoading, router])

  const redirectIfAuthenticated = useCallback(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      router.push('/dashboard')
    }
  }, [auth.isAuthenticated, auth.isLoading, router])

  return {
    ...auth,
    requireAuth,
    redirectIfAuthenticated
  }
}
