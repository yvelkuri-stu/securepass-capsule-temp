
// 📁 src/store/capsules.ts (COMPLETE SECURE VERSION - Replace existing file)
import { create } from 'zustand'
import { Capsule, DashboardStats } from '@/types'
import { SecureCapsuleService, SecureCapsule } from '@/lib/secure-capsules'

interface SecureCapsuleStore {
  capsules: SecureCapsule[]
  selectedCapsule: SecureCapsule | null
  unlockedCapsules: Map<string, any> // Store decrypted content temporarily
  isLoading: boolean
  error: string | null
  dashboardStats: DashboardStats | null
  
  // Core capsule management
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
  
  // Secure capsule access
  getCapsule: (id: string, password?: string) => Promise<SecureCapsule>
  unlockCapsule: (id: string, password: string) => Promise<SecureCapsule>
  lockCapsule: (id: string) => void
  isUnlocked: (id: string) => boolean
  selectCapsule: (capsule: SecureCapsule | null) => void
  
  // Security operations
  addPasswordProtection: (capsuleId: string, password: string) => Promise<void>
  removePasswordProtection: (capsuleId: string, currentPassword: string) => Promise<void>
  changePassword: (capsuleId: string, oldPassword: string, newPassword: string) => Promise<void>
  verifyPassword: (capsuleId: string, password: string) => Promise<boolean>
  updateCapsuleContent: (capsuleId: string, content: any, password?: string) => Promise<void>
  
  // Utility
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  clearUnlockedData: () => void
}

export const useCapsuleStore = create<SecureCapsuleStore>((set, get) => ({
  capsules: [],
  selectedCapsule: null,
  unlockedCapsules: new Map(),
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
      
      // If capsule was created with content and password, store unlocked version
      if (password && capsuleData.content) {
        const { unlockedCapsules } = get()
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(newCapsule.id, capsuleData.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
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
        updates as any,
        password,
        id
      )
      
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === id ? updatedCapsule : capsule
      )
      set({ capsules: updatedCapsules })

      // Update unlocked content if available
      if (password && updates.content) {
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(id, updates.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
      console.log('✅ Capsule updated:', id)
    } catch (error: any) {
      console.error('❌ Store update error:', error)
      set({ error: error.message || 'Failed to update capsule' })
      throw error
    }
  },

  // Delete capsule and cleanup
  deleteCapsule: async (id: string) => {
    set({ error: null })
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('capsules')
        .delete()
        .eq('id', id)

      if (error) throw error

      const { capsules, unlockedCapsules } = get()
      const filteredCapsules = capsules.filter(capsule => capsule.id !== id)
      
      // Remove from unlocked data
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.delete(id)
      
      set({ 
        capsules: filteredCapsules,
        unlockedCapsules: newUnlocked
      })
      
      console.log('✅ Capsule deleted:', id)
    } catch (error: any) {
      console.error('❌ Store delete error:', error)
      set({ error: error.message || 'Failed to delete capsule' })
      throw error
    }
  },

  // Get capsule (may require password for encrypted content)
  getCapsule: async (id: string, password?: string) => {
    set({ error: null })
    
    try {
      const capsule = await SecureCapsuleService.getCapsule(id, password)
      
      // Update the capsule in our local state
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(c => 
        c.id === id ? capsule : c
      )
      set({ capsules: updatedCapsules })
      
      // Store decrypted content if password was provided
      if (password && capsule.content && !capsule.content.encrypted) {
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(id, capsule.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
      return capsule
    } catch (error: any) {
      console.error('❌ Store getCapsule error:', error)
      set({ error: error.message || 'Failed to access capsule' })
      throw error
    }
  },

  // Unlock and decrypt a capsule
  unlockCapsule: async (id: string, password: string) => {
    set({ error: null })
    
    try {
      const capsule = await SecureCapsuleService.getCapsule(id, password)
      
      // Store decrypted content
      const { unlockedCapsules, capsules } = get()
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.set(id, capsule.content)
      
      // Update capsule in list
      const updatedCapsules = capsules.map(c => 
        c.id === id ? capsule : c
      )
      
      set({ 
        unlockedCapsules: newUnlocked,
        capsules: updatedCapsules
      })
      
      console.log('✅ Capsule unlocked:', id)
      return capsule
    } catch (error: any) {
      console.error('❌ Unlock error:', error)
      set({ error: error.message || 'Failed to unlock capsule' })
      throw error
    }
  },

  // Lock a capsule (remove from unlocked data)
  lockCapsule: (id: string) => {
    const { unlockedCapsules } = get()
    const newUnlocked = new Map(unlockedCapsules)
    newUnlocked.delete(id)
    set({ unlockedCapsules: newUnlocked })
    console.log('🔒 Capsule locked:', id)
  },

  // Check if capsule is unlocked
  isUnlocked: (id: string) => {
    const { unlockedCapsules } = get()
    return unlockedCapsules.has(id)
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
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { 
              ...capsule, 
              isEncrypted: true,
              security: { ...capsule.security, passwordProtected: true }
            }
          : capsule
      )
      
      // Remove from unlocked data since it's now encrypted
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.delete(capsuleId)
      
      set({ 
        capsules: updatedCapsules,
        unlockedCapsules: newUnlocked
      })
      
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

  // Change capsule password
  changePassword: async (capsuleId: string, oldPassword: string, newPassword: string) => {
    set({ error: null })
    
    try {
      // First decrypt with old password
      const capsule = await SecureCapsuleService.getCapsule(capsuleId, oldPassword)
      
      // Then re-encrypt with new password
      await SecureCapsuleService.saveCapsule(
        {
          userId: capsule.userId,
          title: capsule.title,
          description: capsule.description,
          dataTypes: capsule.dataTypes,
          content: capsule.content,
          metadata: capsule.metadata,
          sharing: capsule.sharing,
          security: capsule.security
        },
        newPassword,
        capsuleId
      )
      
      // Update unlocked data with new content
      const { unlockedCapsules } = get()
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.set(capsuleId, capsule.content)
      set({ unlockedCapsules: newUnlocked })
      
      console.log('✅ Password changed for capsule:', capsuleId)
    } catch (error: any) {
      console.error('❌ Change password error:', error)
      set({ error: error.message || 'Failed to change password' })
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
      
      // Update local state
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { ...capsule, content: password ? { encrypted: true } : content }
          : capsule
      )
      
      // Update unlocked content if not encrypted
      let newUnlocked = new Map(unlockedCapsules)
      if (!password) {
        newUnlocked.set(capsuleId, content)
      } else if (unlockedCapsules.has(capsuleId)) {
        newUnlocked.set(capsuleId, content)
      }
      
      set({ 
        capsules: updatedCapsules,
        unlockedCapsules: newUnlocked
      })
      
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
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // Clear all unlocked data (for security)
  clearUnlockedData: () => {
    set({ unlockedCapsules: new Map() })
    console.log('🧹 Cleared all unlocked capsule data')
  }
}))

// Enhanced helper hooks
export const useSecureCapsule = (capsuleId: string) => {
  const store = useCapsuleStore()
  const capsule = store.capsules.find(c => c.id === capsuleId)
  const isUnlocked = store.isUnlocked(capsuleId)
  const unlockedContent = store.unlockedCapsules.get(capsuleId)
  
  return {
    capsule,
    isEncrypted: capsule?.isEncrypted || false,
    isPasswordProtected: capsule?.security.passwordProtected || false,
    isUnlocked,
    unlockedContent,
    getCapsule: (password?: string) => store.getCapsule(capsuleId, password),
    unlockCapsule: (password: string) => store.unlockCapsule(capsuleId, password),
    lockCapsule: () => store.lockCapsule(capsuleId),
    verifyPassword: (password: string) => store.verifyPassword(capsuleId, password),
    addPasswordProtection: (password: string) => store.addPasswordProtection(capsuleId, password),
    removePasswordProtection: (password: string) => store.removePasswordProtection(capsuleId, password),
    changePassword: (oldPassword: string, newPassword: string) => store.changePassword(capsuleId, oldPassword, newPassword),
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
    unlockedCapsules: Array.from(store.unlockedCapsules.keys()),
    createEncryptedCapsule: (capsuleData: any, password: string) => 
      store.createCapsule(capsuleData, password),
    createUnencryptedCapsule: (capsuleData: any) => 
      store.createCapsule(capsuleData),
    clearAllUnlocked: () => store.clearUnlockedData()
  }}