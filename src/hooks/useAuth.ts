// 📁 src/hooks/useAuth.ts (FIXED - Proper dependencies)
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'

export function useAuth() {
  const auth = useAuthStore()
  const router = useRouter()

  // Initialize auth on mount - FIXED: Added auth to dependencies
  useEffect(() => {
    auth.initialize()
  }, [auth.initialize]) // FIXED: Only depend on the initialize function

  // Auto-redirect after successful authentication
  useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      // Only redirect if we're on auth pages
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/auth/') || currentPath === '/') {
        router.push('/dashboard')
      }
    }
  }, [auth.isAuthenticated, auth.isLoading, router])

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