
// 📁 src/store/capsules.ts (REPLACE THE EXISTING FILE)
import { create } from 'zustand'
import { Capsule, DashboardStats } from '@/types'
import { CapsuleService } from '@/lib/capsules'

interface CapsuleStore {
  capsules: Capsule[]
  selectedCapsule: Capsule | null
  isLoading: boolean
  error: string | null
  dashboardStats: DashboardStats | null
  
  fetchCapsules: () => Promise<void>
  createCapsule: (capsule: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateCapsule: (id: string, updates: Partial<Capsule>) => Promise<void>
  deleteCapsule: (id: string) => Promise<void>
  selectCapsule: (capsule: Capsule | null) => void
  fetchDashboardStats: () => Promise<void>
  clearError: () => void
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  capsules: [],
  selectedCapsule: null,
  isLoading: false,
  error: null,
  dashboardStats: null,

  fetchCapsules: async () => {
    set({ isLoading: true, error: null })
    console.log('Fetching capsules from store...')
    
    try {
      const capsules = await CapsuleService.getUserCapsules()
      console.log('Store received capsules:', capsules)
      set({ capsules, isLoading: false })
    } catch (error: any) {
      console.error('Store fetch error:', error)
      set({ 
        error: error.message || 'Failed to fetch capsules', 
        isLoading: false 
      })
    }
  },

  createCapsule: async (capsuleData) => {
    set({ isLoading: true, error: null })
    console.log('Store creating capsule:', capsuleData)
    
    try {
      const newCapsule = await CapsuleService.createCapsule(capsuleData)
      console.log('Store created capsule:', newCapsule)
      
      const { capsules } = get()
      set({ 
        capsules: [newCapsule, ...capsules], 
        isLoading: false 
      })
    } catch (error: any) {
      console.error('Store create error:', error)
      set({ 
        error: error.message || 'Failed to create capsule', 
        isLoading: false 
      })
      throw error
    }
  },

  updateCapsule: async (id: string, updates: Partial<Capsule>) => {
    try {
      const updatedCapsule = await CapsuleService.updateCapsule(id, updates)
      const { capsules } = get()
      const updatedCapsules = capsules.map(capsule =>
        capsule.id === id ? updatedCapsule : capsule
      )
      set({ capsules: updatedCapsules })
    } catch (error: any) {
      set({ error: error.message || 'Failed to update capsule' })
      throw error
    }
  },

  deleteCapsule: async (id: string) => {
    try {
      await CapsuleService.deleteCapsule(id)
      const { capsules } = get()
      const filteredCapsules = capsules.filter(capsule => capsule.id !== id)
      set({ capsules: filteredCapsules })
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete capsule' })
      throw error
    }
  },

  selectCapsule: (capsule: Capsule | null) => {
    set({ selectedCapsule: capsule })
  },

  fetchDashboardStats: async () => {
    try {
      const stats = await CapsuleService.getDashboardStats()
      set({ dashboardStats: stats })
    } catch (error: any) {
      console.error('Dashboard stats error:', error)
      set({ error: error.message || 'Failed to fetch dashboard stats' })
    }
  },

  clearError: () => set({ error: null })
}))
