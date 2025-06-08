// 📁 src/hooks/useAuth.ts (Fixed with proper redirect)
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAuth() {
  const auth = useAuthStore()
  const router = useRouter()

  // Initialize auth on mount
  useEffect(() => {
    auth.initialize()
  }, [])

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

  const requireAuth = () => {
    if (!auth.isAuthenticated && !auth.isLoading) {
      router.push('/auth/login')
    }
  }

  const redirectIfAuthenticated = () => {
    if (auth.isAuthenticated && !auth.isLoading) {
      router.push('/dashboard')
    }
  }

  return {
    ...auth,
    requireAuth,
    redirectIfAuthenticated
  }
}
