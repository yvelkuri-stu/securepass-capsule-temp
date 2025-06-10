// 📁 src/store/capsules.ts (UPDATED - Secure Version)
import { create } from 'zustand'
import { Capsule, DashboardStats } from '@/types'
import { SecureCapsuleService, SecureCapsule } from '@/lib/secure-capsules'

interface SecureCapsuleStore {
  capsules: SecureCapsule[]
  selectedCapsule: SecureCapsule | null
  isLoading: boolean
  error: string | null
  dashboardStats: DashboardStats | null
  
  // Capsule management
  fetchCapsules: () => Promise<void>
  createCapsule: (
    capsule: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>, 
    password?: string
  ) => Promise<SecureCapsule>
  updateCapsule: (
    id: string, 
    updates: Partial<Capsule>, 
    password?: string
  ) => Promise<void>
  deleteCapsule: (id: string) => Promise<void>
  
  // Capsule access
  getCapsule: (id: string, password?: string) => Promise<SecureCapsule>
  selectCapsule: (capsule: SecureCapsule | null) => void
  
  // Security features
  addPasswordProtection: (capsuleId: string, password: string) => Promise<void>
  removePasswordProtection: (capsuleId: string, currentPassword: string) => Promise<void>
  verifyPassword: (capsuleId: string, password: string) => Promise<boolean>
  updateCapsuleContent: (capsuleId: string, content: any, password?: string) => Promise<void>
  
  // Utility
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useCapsuleStore = create<SecureCapsuleStore>((set, get) => ({
  capsules: [],
  selectedCapsule: null,
  isLoading: false,
  error: null,
  dashboardStats: null,

  // Fetch all capsules (content remains encrypted)
  fetchCapsules: async () => {
    set({ isLoading: true, error: null })
    console.log('🔍 Fetching secure capsules from store...')
    
    try {
      const capsules = await SecureCapsuleService.getUserCapsules()
      console.log('✅ Store received secure capsules:', capsules.length)
      set({ capsules, isLoading: false })
    } catch (error: any) {
      console.error('❌ Store fetch error:', error)
      set({ 
        error: error.message || 'Failed to fetch capsules', 
        isLoading: false 
      })
    }
  },

  // Create a new capsule with optional encryption
  createCapsule: async (capsuleData, password) => {
    set({ isLoading: true, error: null })
    console.log('🔒 Store creating secure capsule:', { 
      title: capsuleData.title, 
      encrypted: !!password 
    })
    
    try {
      const newCapsule = await SecureCapsuleService.saveCapsule(capsuleData, password)
      console.log('✅ Store created secure capsule:', newCapsule.id)
      
      const { capsules } = get()
      set({ 
        capsules: [newCapsule, ...capsules], 
        isLoading: false 
      })
      
      return newCapsule
    } catch (error: any) {
      console.error('❌ Store create error:', error)
      set({ 
        error: error.message || 'Failed to create capsule', 
        isLoading: false 
      })
      throw error
    }
  },

  // Update capsule (handles encryption automatically)
  updateCapsule: async (id: string, updates: Partial<Capsule>, password?: string) => {
    set({ error: null })
    
    try {
      const updatedCapsule = await SecureCapsuleService.saveCapsule(
        updates as any, // Type assertion for compatibility
        password,
        id
      )
      
      const { capsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === id ? updatedCapsule : capsule
      )
      set({ capsules: updatedCapsules })
    } catch (error: any) {
      console.error('❌ Store update error:', error)
      set({ error: error.message || 'Failed to update capsule' })
      throw error
    }
  },

  // Delete capsule
  deleteCapsule: async (id: string) => {
    set({ error: null })
    
    try {
      // Use the basic CapsuleService for deletion since SecureCapsuleService doesn't have it
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('capsules')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { capsules } = get()
      const filteredCapsules = capsules.filter(capsule => capsule.id !== id)
      set({ capsules: filteredCapsules })
      
      console.log('✅ Capsule deleted:', id)
    } catch (error: any) {
      console.error('❌ Store delete error:', error)
      set({ error: error.message || 'Failed to delete capsule' })
      throw error
    }
  },

  // Get and decrypt a specific capsule
  getCapsule: async (id: string, password?: string) => {
    set({ error: null })
    
    try {
      const capsule = await SecureCapsuleService.getCapsule(id, password)
      
      // Update the capsule in our local state if it exists
      const { capsules } = get()
      const updatedCapsules = capsules.map(c => 
        c.id === id ? capsule : c
      )
      set({ capsules: updatedCapsules })
      
      return capsule
    } catch (error: any) {
      console.error('❌ Store getCapsule error:', error)
      set({ error: error.message || 'Failed to access capsule' })
      throw error
    }
  },

  // Select a capsule for viewing
  selectCapsule: (capsule: SecureCapsule | null) => {
    set({ selectedCapsule: capsule })
  },

  // Add password protection to existing capsule
  addPasswordProtection: async (capsuleId: string, password: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.addPasswordProtection(capsuleId, password)
      
      // Update the capsule in our local state
      const { capsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { 
              ...capsule, 
              isEncrypted: true,
              security: { ...capsule.security, passwordProtected: true }
            }
          : capsule
      )
      set({ capsules: updatedCapsules })
      
      console.log('✅ Password protection added to capsule:', capsuleId)
    } catch (error: any) {
      console.error('❌ Add password protection error:', error)
      set({ error: error.message || 'Failed to add password protection' })
      throw error
    }
  },

  // Remove password protection from capsule
  removePasswordProtection: async (capsuleId: string, currentPassword: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.removePasswordProtection(capsuleId, currentPassword)
      
      // Update the capsule in our local state
      const { capsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { 
              ...capsule, 
              isEncrypted: false,
              security: { ...capsule.security, passwordProtected: false }
            }
          : capsule
      )
      set({ capsules: updatedCapsules })
      
      console.log('✅ Password protection removed from capsule:', capsuleId)
    } catch (error: any) {
      console.error('❌ Remove password protection error:', error)
      set({ error: error.message || 'Failed to remove password protection' })
      throw error
    }
  },

  // Verify password for a capsule
  verifyPassword: async (capsuleId: string, password: string) => {
    try {
      const isValid = await SecureCapsuleService.verifyPassword(capsuleId, password)
      return isValid
    } catch (error: any) {
      console.error('❌ Password verification error:', error)
      set({ error: error.message || 'Failed to verify password' })
      return false
    }
  },

  // Update capsule content (handles encryption automatically)
  updateCapsuleContent: async (capsuleId: string, content: any, password?: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.updateCapsuleContent(capsuleId, content, password)
      
      // Optionally refresh the capsule in local state
      const { capsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { ...capsule, content: password ? { encrypted: true } : content }
          : capsule
      )
      set({ capsules: updatedCapsules })
      
      console.log('✅ Capsule content updated:', capsuleId)
    } catch (error: any) {
      console.error('❌ Update content error:', error)
      set({ error: error.message || 'Failed to update content' })
      throw error
    }
  },

  // Fetch dashboard statistics
  fetchDashboardStats: async () => {
    try {
      // Use basic CapsuleService for stats since SecureCapsuleService doesn't have it
      const { CapsuleService } = await import('@/lib/capsules')
      const stats = await CapsuleService.getDashboardStats()
      set({ dashboardStats: stats })
    } catch (error: any) {
      console.error('❌ Dashboard stats error:', error)
      set({ error: error.message || 'Failed to fetch dashboard stats' })
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Set loading state
  setLoading: (loading: boolean) => set({ isLoading: loading })
}))

// Export helper hooks for common operations
export const useSecureCapsule = (capsuleId: string) => {
  const store = useCapsuleStore()
  const capsule = store.capsules.find(c => c.id === capsuleId)
  
  return {
    capsule,
    isEncrypted: capsule?.isEncrypted || false,
    isPasswordProtected: capsule?.security.passwordProtected || false,
    getCapsule: (password?: string) => store.getCapsule(capsuleId, password),
    verifyPassword: (password: string) => store.verifyPassword(capsuleId, password),
    addPasswordProtection: (password: string) => store.addPasswordProtection(capsuleId, password),
    removePasswordProtection: (password: string) => store.removePasswordProtection(capsuleId, password),
    updateContent: (content: any, password?: string) => store.updateCapsuleContent(capsuleId, content, password)
  }
}

export const useEncryptedCapsules = () => {
  const store = useCapsuleStore()
  
  return {
    capsules: store.capsules,
    encryptedCapsules: store.capsules.filter(c => c.isEncrypted),
    unencryptedCapsules: store.capsules.filter(c => !c.isEncrypted),
    passwordProtectedCapsules: store.capsules.filter(c => c.security.passwordProtected),
    createEncryptedCapsule: (capsuleData: any, password: string) => 
      store.createCapsule(capsuleData, password),
    createUnencryptedCapsule: (capsuleData: any) => 
      store.createCapsule(capsuleData)
  }
}