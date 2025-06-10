// 📁 src/store/capsules.ts (COMPLETE INTEGRATION - Replace existing file)
import { create } from 'zustand'
import { Capsule, DashboardStats } from '@/types'
import { SecureCapsuleService, SecureCapsule } from '@/lib/secure-capsules'

interface CapsuleStore {
  // State
  capsules: SecureCapsule[]
  selectedCapsule: SecureCapsule | null
  unlockedCapsules: Map<string, any> // Store decrypted content temporarily
  isLoading: boolean
  error: string | null
  dashboardStats: DashboardStats | null
  
  // Core CRUD operations
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
  
  // Security operations
  getCapsule: (id: string, password?: string) => Promise<SecureCapsule>
  unlockCapsule: (id: string, password: string) => Promise<SecureCapsule>
  lockCapsule: (id: string) => void
  isUnlocked: (id: string) => boolean
  verifyPassword: (capsuleId: string, password: string) => Promise<boolean>
  
  // Password management
  addPasswordProtection: (capsuleId: string, password: string) => Promise<void>
  removePasswordProtection: (capsuleId: string, currentPassword: string) => Promise<void>
  changePassword: (capsuleId: string, oldPassword: string, newPassword: string) => Promise<void>
  
  // Content management
  updateCapsuleContent: (capsuleId: string, content: any, password?: string) => Promise<void>
  
  // Utility
  selectCapsule: (capsule: SecureCapsule | null) => void
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
  setLoading: (loading: boolean) => void
  clearUnlockedData: () => void
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  // Initial state
  capsules: [],
  selectedCapsule: null,
  unlockedCapsules: new Map(),
  isLoading: false,
  error: null,
  dashboardStats: null,

  // Fetch all user's capsules
  fetchCapsules: async () => {
    set({ isLoading: true, error: null })
    console.log('🔍 Fetching secure capsules...')
    
    try {
      const capsules = await SecureCapsuleService.getUserCapsules()
      console.log(`✅ Fetched ${capsules.length} capsules`)
      set({ capsules, isLoading: false })
    } catch (error: any) {
      console.error('❌ Fetch capsules error:', error)
      set({ 
        error: error.message || 'Failed to fetch capsules', 
        isLoading: false 
      })
    }
  },

  // Create new capsule with optional encryption
  createCapsule: async (capsuleData, password) => {
    set({ isLoading: true, error: null })
    console.log('🔒 Creating secure capsule:', { 
      title: capsuleData.title, 
      encrypted: !!password 
    })
    
    try {
      const newCapsule = await SecureCapsuleService.saveCapsule(capsuleData, password)
      console.log('✅ Created capsule:', newCapsule.id)
      
      // Add to store
      const { capsules } = get()
      set({ 
        capsules: [newCapsule, ...capsules], 
        isLoading: false 
      })
      
      // If created with content and password, cache decrypted content
      if (password && capsuleData.content) {
        const { unlockedCapsules } = get()
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(newCapsule.id, capsuleData.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
      return newCapsule
    } catch (error: any) {
      console.error('❌ Create capsule error:', error)
      set({ 
        error: error.message || 'Failed to create capsule', 
        isLoading: false 
      })
      throw error
    }
  },

  // Update existing capsule
  updateCapsule: async (id: string, updates: Partial<Capsule>, password?: string) => {
    set({ error: null })
    
    try {
      // Get current capsule to merge updates
      const { capsules } = get()
      const currentCapsule = capsules.find(c => c.id === id)
      if (!currentCapsule) throw new Error('Capsule not found')

      // Merge updates with current data
      const updatedData = {
        userId: currentCapsule.userId,
        title: updates.title || currentCapsule.title,
        description: updates.description !== undefined ? updates.description : currentCapsule.description,
        dataTypes: updates.dataTypes || currentCapsule.dataTypes,
        content: updates.content || currentCapsule.content,
        metadata: { ...currentCapsule.metadata, ...updates.metadata },
        sharing: { ...currentCapsule.sharing, ...updates.sharing },
        security: { ...currentCapsule.security, ...updates.security }
      }

      const updatedCapsule = await SecureCapsuleService.saveCapsule(
        updatedData,
        password,
        id
      )
      
      // Update in store
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === id ? updatedCapsule : capsule
      )
      set({ capsules: updatedCapsules })

      // Update unlocked content if available
      if (password && updates.content) {
        const { unlockedCapsules } = get()
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(id, updates.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
      console.log('✅ Updated capsule:', id)
    } catch (error: any) {
      console.error('❌ Update capsule error:', error)
      set({ error: error.message || 'Failed to update capsule' })
      throw error
    }
  },

  // Delete capsule
  deleteCapsule: async (id: string) => {
    set({ error: null })
    
    try {
      // Delete from database via supabase directly for now
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('capsules')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from store
      const { capsules, unlockedCapsules } = get()
      const filteredCapsules = capsules.filter(capsule => capsule.id !== id)
      
      // Clean up unlocked data
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.delete(id)
      
      set({ 
        capsules: filteredCapsules,
        unlockedCapsules: newUnlocked
      })
      
      console.log('✅ Deleted capsule:', id)
    } catch (error: any) {
      console.error('❌ Delete capsule error:', error)
      set({ error: error.message || 'Failed to delete capsule' })
      throw error
    }
  },

  // Get capsule with optional decryption
  getCapsule: async (id: string, password?: string) => {
    set({ error: null })
    
    try {
      const capsule = await SecureCapsuleService.getCapsule(id, password)
      
      // Update in local state
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(c => 
        c.id === id ? capsule : c
      )
      set({ capsules: updatedCapsules })
      
      // Cache decrypted content if password was provided and content was decrypted
      if (password && capsule.content && !capsule.content.encrypted) {
        const newUnlocked = new Map(unlockedCapsules)
        newUnlocked.set(id, capsule.content)
        set({ unlockedCapsules: newUnlocked })
      }
      
      return capsule
    } catch (error: any) {
      console.error('❌ Get capsule error:', error)
      set({ error: error.message || 'Failed to access capsule' })
      throw error
    }
  },

  // Unlock capsule and cache content
  unlockCapsule: async (id: string, password: string) => {
    set({ error: null })
    
    try {
      const capsule = await SecureCapsuleService.getCapsule(id, password)
      
      // Cache decrypted content
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
      
      console.log('✅ Unlocked capsule:', id)
      return capsule
    } catch (error: any) {
      console.error('❌ Unlock error:', error)
      set({ error: error.message || 'Invalid password or unlock failed' })
      throw error
    }
  },

  // Lock capsule (remove from cache)
  lockCapsule: (id: string) => {
    const { unlockedCapsules } = get()
    const newUnlocked = new Map(unlockedCapsules)
    newUnlocked.delete(id)
    set({ unlockedCapsules: newUnlocked })
    console.log('🔒 Locked capsule:', id)
  },

  // Check if capsule is unlocked
  isUnlocked: (id: string) => {
    const { unlockedCapsules } = get()
    return unlockedCapsules.has(id)
  },

  // Verify password
  verifyPassword: async (capsuleId: string, password: string) => {
    try {
      const isValid = await SecureCapsuleService.verifyPassword(capsuleId, password)
      if (!isValid) {
        set({ error: 'Invalid password' })
      }
      return isValid
    } catch (error: any) {
      console.error('❌ Password verification error:', error)
      set({ error: error.message || 'Failed to verify password' })
      return false
    }
  },

  // Add password protection
  addPasswordProtection: async (capsuleId: string, password: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.addPasswordProtection(capsuleId, password)
      
      // Update local state
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
      
      // Remove from unlocked cache since it's now encrypted
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.delete(capsuleId)
      
      set({ 
        capsules: updatedCapsules,
        unlockedCapsules: newUnlocked
      })
      
      console.log('✅ Added password protection:', capsuleId)
    } catch (error: any) {
      console.error('❌ Add password protection error:', error)
      set({ error: error.message || 'Failed to add password protection' })
      throw error
    }
  },

  // Remove password protection
  removePasswordProtection: async (capsuleId: string, currentPassword: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.removePasswordProtection(capsuleId, currentPassword)
      
      // Update local state
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
      
      console.log('✅ Removed password protection:', capsuleId)
    } catch (error: any) {
      console.error('❌ Remove password protection error:', error)
      set({ error: error.message || 'Failed to remove password protection' })
      throw error
    }
  },

  // Change password
  changePassword: async (capsuleId: string, oldPassword: string, newPassword: string) => {
    set({ error: null })
    
    try {
      // Get current capsule with old password
      const capsule = await SecureCapsuleService.getCapsule(capsuleId, oldPassword)
      
      // Re-save with new password
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
      
      // Update unlocked cache
      const { unlockedCapsules } = get()
      const newUnlocked = new Map(unlockedCapsules)
      newUnlocked.set(capsuleId, capsule.content)
      set({ unlockedCapsules: newUnlocked })
      
      console.log('✅ Changed password for capsule:', capsuleId)
    } catch (error: any) {
      console.error('❌ Change password error:', error)
      set({ error: error.message || 'Failed to change password' })
      throw error
    }
  },

  // Update capsule content
  updateCapsuleContent: async (capsuleId: string, content: any, password?: string) => {
    set({ error: null })
    
    try {
      await SecureCapsuleService.updateCapsuleContent(capsuleId, content, password)
      
      // Update local state
      const { capsules, unlockedCapsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === capsuleId 
          ? { 
              ...capsule, 
              content: password ? { encrypted: true } : content,
              updatedAt: new Date()
            }
          : capsule
      )
      
      // Update unlocked cache
      let newUnlocked = new Map(unlockedCapsules)
      if (password && unlockedCapsules.has(capsuleId)) {
        // Keep decrypted version in cache if was previously unlocked
        newUnlocked.set(capsuleId, content)
      } else if (!password) {
        // Store unencrypted content
        newUnlocked.set(capsuleId, content)
      }
      
      set({ 
        capsules: updatedCapsules,
        unlockedCapsules: newUnlocked
      })
      
      console.log('✅ Updated capsule content:', capsuleId)
    } catch (error: any) {
      console.error('❌ Update content error:', error)
      set({ error: error.message || 'Failed to update content' })
      throw error
    }
  },

  // Select capsule for detailed view
  selectCapsule: (capsule: SecureCapsule | null) => {
    set({ selectedCapsule: capsule })
  },

  // Fetch dashboard statistics
  fetchDashboardStats: async () => {
    try {
      // Use simplified stats calculation for now
      const { capsules } = get()
      
      const stats: DashboardStats = {
        totalCapsules: capsules.length,
        sharedItems: capsules.filter(c => c.sharing.isShared).length,
        pendingAlerts: 0, // TODO: Implement alerts
        securityScore: Math.round(
          capsules.reduce((sum, c) => {
            let score = 70 // Base score
            if (c.isEncrypted) score += 20
            if (c.security.passwordProtected) score += 10
            return sum + score
          }, 0) / Math.max(capsules.length, 1)
        ),
        recentActivity: [] // TODO: Implement from activity_log
      }
      
      set({ dashboardStats: stats })
    } catch (error: any) {
      console.error('❌ Dashboard stats error:', error)
      set({ error: error.message || 'Failed to fetch dashboard stats' })
    }
  },

  // Utility functions
  clearError: () => set({ error: null }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  clearUnlockedData: () => {
    set({ unlockedCapsules: new Map() })
    console.log('🧹 Cleared all unlocked data')
  }
}))

// Custom hooks for easier usage
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
    changePassword: (oldPassword: string, newPassword: string) => 
      store.changePassword(capsuleId, oldPassword, newPassword),
    updateContent: (content: any, password?: string) => 
      store.updateCapsuleContent(capsuleId, content, password)
  }
}

export const useSecurityMetrics = () => {
  const { capsules } = useCapsuleStore()
  
  const encryptedCount = capsules.filter(c => c.isEncrypted).length
  const passwordProtectedCount = capsules.filter(c => c.security.passwordProtected).length
  const totalCount = capsules.length
  
  return {
    totalCapsules: totalCount,
    encryptedCapsules: encryptedCount,
    passwordProtectedCapsules: passwordProtectedCount,
    encryptionRate: totalCount > 0 ? Math.round((encryptedCount / totalCount) * 100) : 0,
    protectionRate: totalCount > 0 ? Math.round((passwordProtectedCount / totalCount) * 100) : 0,
    overallSecurityScore: totalCount > 0 ? Math.round(
      ((encryptedCount * 0.6 + passwordProtectedCount * 0.4) / totalCount) * 100
    ) : 0
  }
}