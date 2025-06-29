import { supabase } from './supabase'
import { User } from '@/types'
import { validateEnv } from './env'

export class AuthService {
  private static isInitialized = false

  static init() {
    if (this.isInitialized) return
    
    try {
      // Only validate env in browser or when explicitly needed
      if (typeof window !== 'undefined') {
        validateEnv()
      }
      this.isInitialized = true
      console.log('AuthService initialized successfully')
    } catch (error) {
      console.error('AuthService initialization failed:', error)
      
      // In production, provide more helpful error message
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'Authentication service is not properly configured. Please contact support.'
        )
      }
      
      throw new Error('Authentication service initialization failed')
    }
  }

  static async signUp(email: string, password: string, displayName: string) {
    try {
      this.init()
      
      console.log('Attempting sign up for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      if (error) {
        console.error('Supabase signUp error:', error)
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('No user data returned from signup')
      }

      console.log('Sign up successful:', data.user.email)
      return data
      
    } catch (error: any) {
      console.error('SignUp error:', error)
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        throw new Error('An account with this email already exists')
      } else if (error.message?.includes('Invalid email')) {
        throw new Error('Please enter a valid email address')
      } else if (error.message?.includes('Password should be')) {
        throw new Error('Password must be at least 6 characters long')
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again')
      }
      
      throw new Error(error.message || 'Failed to create account')
    }
  }

  static async signIn(email: string, password: string) {
    try {
      this.init()
      
      console.log('Attempting sign in for:', email)
      
      // Add connection timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 second timeout
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      clearTimeout(timeoutId)

      if (error) {
        console.error('Supabase signIn error:', error)
        throw new Error(error.message)
      }

      if (!data.user) {
        throw new Error('No user data returned from sign in')
      }

      console.log('Sign in successful:', data.user.email)
      
      // Update last login time
      try {
        await this.updateProfile({ lastLoginAt: new Date() })
      } catch (profileError) {
        console.warn('Failed to update last login time:', profileError)
        // Don't fail the login for this
      }

      return data
      
    } catch (error: any) {
      console.error('SignIn error:', error)
      
      // Handle specific error cases
      if (error.name === 'AbortError') {
        throw new Error('Login timeout. Please check your connection and try again')
      } else if (error.message?.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password')
      } else if (error.message?.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before signing in')
      } else if (error.message?.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please wait a few minutes and try again')
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your connection and try again')
      }
      
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  static async signInWithGoogle() {
    try {
      this.init()
      
      console.log('Attempting Google sign in')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Google signIn error:', error)
        throw new Error(error.message)
      }

      return data
      
    } catch (error: any) {
      console.error('Google SignIn error:', error)
      throw new Error(error.message || 'Failed to sign in with Google')
    }
  }

  static async signOut() {
    try {
      console.log('Attempting sign out')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('SignOut error:', error)
        throw new Error(error.message)
      }
      
      console.log('Sign out successful')
      
    } catch (error: any) {
      console.error('SignOut error:', error)
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Get session error:', error)
        return null
      }
      
      return session
      
    } catch (error: any) {
      console.error('Get session error:', error)
      return null
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('Get current user error:', error)
        return null
      }
      
      if (!user) {
        return null
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Get profile error:', profileError)
        // Return basic user info if profile fetch fails
        return {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || '',
          createdAt: new Date(user.created_at),
          lastLoginAt: new Date(),
          mfaEnabled: false,
          securityScore: 75,
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name || '',
        profilePicture: profile.profile_picture,
        createdAt: new Date(profile.created_at),
        lastLoginAt: profile.last_login_at ? new Date(profile.last_login_at) : new Date(),
        mfaEnabled: profile.mfa_enabled,
        securityScore: profile.security_score,
      }
      
    } catch (error: any) {
      console.error('Get current user error:', error)
      return null
    }
  }

  static async updateProfile(updates: Partial<User>) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          profile_picture: updates.profilePicture,
          last_login_at: updates.lastLoginAt?.toISOString(),
          mfa_enabled: updates.mfaEnabled,
          security_score: updates.securityScore,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Update profile error:', error)
        throw new Error(error.message)
      }
      
    } catch (error: any) {
      console.error('Update profile error:', error)
      throw new Error(error.message || 'Failed to update profile')
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  // Utility method to check if Supabase is properly configured
  static async checkConnection() {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        console.error('Supabase connection check failed:', error)
        return false
      }
      
      console.log('Supabase connection successful')
      return true
      
    } catch (error) {
      console.error('Supabase connection check failed:', error)
      return false
    }
  }
}