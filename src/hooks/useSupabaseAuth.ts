// 📁 src/hooks/useSupabaseAuth.ts (Real auth hook)
import { useState, useEffect } from 'react'
import { AuthService } from '@/lib/auth'
import { User } from '@/types'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const user = await AuthService.getCurrentUser()
        setUser(user)
      } catch (err) {
        console.error('Error getting initial session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(setUser)

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await AuthService.signUp(email, password, displayName)
      // User will be set via onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await AuthService.signIn(email, password)
      // User will be set via onAuthStateChange
    } catch (err: any) {
      setError(err.message || 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await AuthService.signOut()
      setUser(null)
    } catch (err: any) {
      setError(err.message || 'Logout failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    try {
      await AuthService.updateProfile(updates)
      // Refresh user data
      const updatedUser = await AuthService.getCurrentUser()
      setUser(updatedUser)
    } catch (err: any) {
      setError(err.message || 'Profile update failed')
      throw err
    }
  }

  return {
    user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user
  }
}