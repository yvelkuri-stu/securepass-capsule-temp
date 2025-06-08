// 📁 src/lib/capsules.ts (Real capsule service - CREATE THIS FILE)
import { supabase } from './supabase'
import { Capsule, ActivityItem, DashboardStats } from '@/types'

export class CapsuleService {
  // Get all capsules for current user
  static async getUserCapsules(): Promise<Capsule[]> {
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching capsules:', error)
      throw error
    }

    console.log('Fetched capsules from database:', data)

    // Transform database format to app format
    return (data || []).map(this.transformCapsule)
  }

  // Create new capsule
  static async createCapsule(capsuleData: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Capsule> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    console.log('Creating capsule for user:', user.id)
    console.log('Capsule data:', capsuleData)

    const dbCapsule = {
      user_id: user.id,
      title: capsuleData.title,
      description: capsuleData.description,
      data_types: capsuleData.dataTypes,
      content: capsuleData.content || {},
      metadata: capsuleData.metadata,
      sharing: capsuleData.sharing,
      security: capsuleData.security,
      last_accessed_at: new Date().toISOString()
    }

    console.log('Database capsule object:', dbCapsule)

    const { data, error } = await supabase
      .from('capsules')
      .insert(dbCapsule)
      .select()
      .single()

    if (error) {
      console.error('Error creating capsule:', error)
      throw error
    }

    console.log('Created capsule in database:', data)

    // Log activity (optional - will fail gracefully if function doesn't exist)
    try {
      await this.logActivity(data.id, 'created', `Created capsule "${capsuleData.title}"`)
    } catch (err) {
      console.warn('Could not log activity:', err)
    }

    return this.transformCapsule(data)
  }

  // Update capsule
  static async updateCapsule(id: string, updates: Partial<Capsule>): Promise<Capsule> {
    const dbUpdates: any = {}
    
    if (updates.title) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.dataTypes) dbUpdates.data_types = updates.dataTypes
    if (updates.content) dbUpdates.content = updates.content
    if (updates.metadata) dbUpdates.metadata = updates.metadata
    if (updates.sharing) dbUpdates.sharing = updates.sharing
    if (updates.security) dbUpdates.security = updates.security

    const { data, error } = await supabase
      .from('capsules')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log activity
    try {
      await this.logActivity(id, 'modified', `Updated capsule "${data.title}"`)
    } catch (err) {
      console.warn('Could not log activity:', err)
    }

    return this.transformCapsule(data)
  }

  // Delete capsule
  static async deleteCapsule(id: string): Promise<void> {
    const { error } = await supabase
      .from('capsules')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Log activity
    try {
      await this.logActivity(id, 'deleted', `Deleted capsule`)
    } catch (err) {
      console.warn('Could not log activity:', err)
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get capsule count
    const { count: totalCapsules } = await supabase
      .from('capsules')
      .select('*', { count: 'exact', head: true })

    // Get shared items count (simplified for now)
    const sharedItems = 0 // TODO: Implement when shared_capsules is ready

    // Get recent activity (simplified for now)
    const recentActivity: ActivityItem[] = []

    // Get user's security score
    const { data: profile } = await supabase
      .from('profiles')
      .select('security_score')
      .eq('id', user.id)
      .single()

    return {
      totalCapsules: totalCapsules || 0,
      sharedItems,
      pendingAlerts: 0,
      securityScore: profile?.security_score || 85,
      recentActivity
    }
  }

  // Log user activity (simplified - will work if RPC function exists)
  private static async logActivity(
    capsuleId: string | null, 
    action: string, 
    description: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      // Try to use RPC function if it exists
      const { error } = await supabase.rpc('log_activity', {
        p_capsule_id: capsuleId,
        p_action: action,
        p_description: description,
        p_metadata: metadata
      })

      if (error) {
        // If RPC doesn't exist, insert directly
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('activity_log')
            .insert({
              user_id: user.id,
              capsule_id: capsuleId,
              action,
              description,
              metadata
            })
        }
      }
    } catch (err) {
      console.warn('Activity logging failed:', err)
    }
  }

  // Transform database record to app format
  private static transformCapsule(dbCapsule: any): Capsule {
    return {
      id: dbCapsule.id,
      userId: dbCapsule.user_id,
      title: dbCapsule.title,
      description: dbCapsule.description,
      dataTypes: dbCapsule.data_types || [],
      content: dbCapsule.content || {},
      metadata: {
        itemCount: dbCapsule.metadata?.itemCount || 0,
        totalSize: dbCapsule.metadata?.totalSize || 0,
        tags: dbCapsule.metadata?.tags || [],
        category: dbCapsule.metadata?.category || 'Personal',
        aiTags: dbCapsule.metadata?.aiTags || [],
        securityLevel: dbCapsule.metadata?.securityLevel || 'medium',
        version: dbCapsule.metadata?.version || 1,
        ...dbCapsule.metadata
      },
      sharing: {
        isShared: dbCapsule.sharing?.isShared || false,
        sharedWith: dbCapsule.sharing?.sharedWith || [],
        emergencyContacts: dbCapsule.sharing?.emergencyContacts || [],
        publicAccess: dbCapsule.sharing?.publicAccess || false,
        ...dbCapsule.sharing
      },
      security: {
        encryptionEnabled: dbCapsule.security?.encryptionEnabled !== false,
        passwordProtected: dbCapsule.security?.passwordProtected || false,
        biometricLock: dbCapsule.security?.biometricLock || false,
        accessLogging: dbCapsule.security?.accessLogging !== false,
        ...dbCapsule.security
      },
      createdAt: new Date(dbCapsule.created_at),
      updatedAt: new Date(dbCapsule.updated_at),
      lastAccessedAt: new Date(dbCapsule.last_accessed_at)
    }
  }
}
