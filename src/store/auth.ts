// 📁 src/store/auth.ts (Updated with real Supabase auth)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User } from '@/types'
import { AuthService } from '@/lib/auth'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start with loading true for initialization
      error: null,

      initialize: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const user = await AuthService.getCurrentUser()
          
          if (user) {
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            })
          }

          // Set up auth state listener
          AuthService.onAuthStateChange((user) => {
            if (user) {
              set({ 
                user, 
                isAuthenticated: true, 
                error: null 
              })
            } else {
              set({ 
                user: null, 
                isAuthenticated: false, 
                error: null 
              })
            }
          })

        } catch (error: any) {
          console.error('Auth initialization error:', error)
          set({ 
            error: 'Failed to initialize authentication', 
            isLoading: false,
            user: null,
            isAuthenticated: false
          })
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signIn(email, password)
          // User will be set via onAuthStateChange
          set({ isLoading: false })
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signUp(email, password, displayName)
          // User will be set via onAuthStateChange
          set({ isLoading: false })
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signOut()
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          })
        } catch (error: any) {
          set({ 
            error: error.message || 'Logout failed', 
            isLoading: false 
          })
          throw error
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const { user } = get()
        if (!user) return

        try {
          await AuthService.updateProfile(updates)
          // User will be updated via onAuthStateChange or we can update locally
          const updatedUser = { ...user, ...updates }
          set({ user: updatedUser })
        } catch (error: any) {
          set({ error: error.message || 'Failed to update profile' })
          throw error
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        // Only persist minimal auth state, not the full user object
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)
