// 📁 src/store/auth.ts (FIXED - Robust initialization and state management)
import { create } from 'zustand'
import { AuthState, User } from '@/types'
import { AuthService } from '@/lib/auth'

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  initialize: () => () => void // Returns the unsubscribe function
}

let onAuthStateChangeUnsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthStore>()((set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start as true until first auth state is known
      error: null,

      initialize: () => {
        // If a listener is already active, unsubscribe from it first
        if (onAuthStateChangeUnsubscribe) {
            onAuthStateChangeUnsubscribe();
        }

        console.log('🚀 Initializing authentication listener...');
        
        // Set up the listener and store the unsubscribe function
        const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
          console.log('🔄 Auth state changed:', user ? user.email : 'logged out');
          set({
            user,
            isAuthenticated: !!user,
            isLoading: false, // We have our answer, so loading is done.
            error: null,
          });
        });

        onAuthStateChangeUnsubscribe = subscription.unsubscribe;

        return onAuthStateChangeUnsubscribe;
      },

      login: async (email: string, password: string) => {
        console.log('🔐 Attempting login for:', email)
        set({ isLoading: true, error: null })
        
        try {
          await AuthService.signIn(email, password)
          console.log('✅ Login successful')
          // The onAuthStateChange listener will handle setting the user state.
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
          // The onAuthStateChange listener will handle setting the user state.
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
          // The onAuthStateChange listener will set user to null.
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
}))
