// 📁 src/store/auth.ts (FIXED - Better initialization and state management)
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
  initialized: boolean // Track initialization state
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      initialized: false,

      initialize: async () => {
        // Prevent multiple initializations
        if (get().initialized) {
          console.log('🔄 Auth already initialized')
          return
        }

        console.log('🚀 Initializing authentication...')
        set({ isLoading: true, error: null })
        
        try {
          const user = await AuthService.getCurrentUser()
          
          if (user) {
            console.log('✅ User found during initialization:', user.email)
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              initialized: true,
              error: null
            })
          } else {
            console.log('❌ No user found during initialization')
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false,
              initialized: true,
              error: null
            })
          }

          // Set up auth state listener (only once)
          if (!get().initialized) {
            AuthService.onAuthStateChange((user) => {
              console.log('🔄 Auth state changed:', user ? user.email : 'logged out')
              if (user) {
                set({ 
                  user, 
                  isAuthenticated: true, 
                  error: null,
                  isLoading: false
                })
              } else {
                set({ 
                  user: null, 
                  isAuthenticated: false, 
                  error: null,
                  isLoading: false
                })
              }
            })
          }

        } catch (error: any) {
          console.error('❌ Auth initialization error:', error)
          set({ 
            error: 'Failed to initialize authentication', 
            isLoading: false,
            user: null,
            isAuthenticated: false,
            initialized: true
          })
        }
      },

      login: async (email: string, password: string) => {
        console.log('🔐 Attempting login for:', email)
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signIn(email, password)
          console.log('✅ Login successful')
          // User will be set via onAuthStateChange
          set({ isLoading: false })
        } catch (error: any) {
          console.error('❌ Login failed:', error)
          set({ 
            error: error.message || 'Login failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        console.log('📝 Attempting registration for:', email)
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signUp(email, password, displayName)
          console.log('✅ Registration successful')
          // User will be set via onAuthStateChange
          set({ isLoading: false })
        } catch (error: any) {
          console.error('❌ Registration failed:', error)
          set({ 
            error: error.message || 'Registration failed. Please try again.', 
            isLoading: false 
          })
          throw error
        }
      },

      logout: async () => {
        console.log('🚪 Logging out...')
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signOut()
          console.log('✅ Logout successful')
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          })
        } catch (error: any) {
          console.error('❌ Logout failed:', error)
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
        // Only persist minimal auth state
        initialized: state.initialized
      }),
    }
  )
)