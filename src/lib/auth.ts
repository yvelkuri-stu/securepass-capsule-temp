
// 📁 src/lib/auth.ts (Updated with better error handling)
import { supabase } from './supabase'
import { User } from '@/types'
import { validateEnv } from './env'

export class AuthService {
  // Initialize and validate environment
  static init() {
    validateEnv()
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, displayName: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })

    if (authError) throw authError

    // Note: Profile creation will be handled by database trigger
    return authData
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // Update last login (optional - will work if RLS policies allow)
    try {
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ 
            last_login_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
      }
    } catch (err) {
      console.warn('Could not update last login:', err)
    }

    return data
  }

  // Sign out
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Get current session
  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  // Get current user with profile
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    if (!user) return null

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.warn('Could not fetch profile:', profileError)
        // Return basic user info if profile fetch fails
        return {
          id: user.id,
          email: user.email!,
          displayName: user.user_metadata?.display_name || '',
          createdAt: new Date(user.created_at),
          lastLoginAt: new Date(),
          mfaEnabled: false,
          securityScore: 75
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name || '',
        profilePicture: profile.profile_picture || undefined,
        createdAt: new Date(profile.created_at),
        lastLoginAt: new Date(profile.last_login_at || profile.created_at),
        mfaEnabled: profile.mfa_enabled,
        securityScore: profile.security_score
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  // Update user profile
  static async updateProfile(updates: Partial<User>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        mfa_enabled: updates.mfaEnabled,
        security_score: updates.securityScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
  }

  // Listen to auth changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}