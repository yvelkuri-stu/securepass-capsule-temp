import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { AuthService } from '@/lib/auth'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    register: storeRegister,
    updateUser,
    setLoading,
    setError,
    initialize
  } = useAuthStore()

  const router = useRouter()

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Check if Supabase is properly configured
        const isConnected = await AuthService.checkConnection()
        if (!isConnected && isMounted) {
          setError('Unable to connect to authentication service')
          return
        }

        // Initialize the auth store
        if (isMounted) {
          initialize()
        }
      } catch (error: any) {
        console.error('Auth initialization error:', error)
        if (isMounted) {
          setError('Authentication initialization failed')
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [initialize, setError])

  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    try {
      setLoading(true)
      setError(null)

      await storeLogin(email, password)
      
      // Successful login
      return true
      
    } catch (error: any) {
      console.error('Login hook error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [storeLogin, setLoading, setError])

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    if (!email || !password || !displayName) {
      throw new Error('All fields are required')
    }

    try {
      setLoading(true)
      setError(null)

      await storeRegister(email, password, displayName)
      
      // Successful registration
      return true
      
    } catch (error: any) {
      console.error('Register hook error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [storeRegister, setLoading, setError])

  const logout = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      await storeLogout()
      
      // Navigate to login after successful logout
      router.push('/auth/login')
      
    } catch (error: any) {
      console.error('Logout hook error:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [storeLogout, router, setLoading, setError])

  const clearError = useCallback(() => {
    setError(null)
  }, [setError])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await AuthService.getCurrentUser()
      if (currentUser) {
        updateUser(currentUser)
      }
    } catch (error: any) {
      console.error('Refresh user error:', error)
      // Don't throw here, just log
    }
  }, [updateUser])

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    clearError,
    refreshUser,
    
    // Utilities
    setLoading
  }
}