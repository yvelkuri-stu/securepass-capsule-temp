// 📁 src/lib/debug.ts (Temporary debug helper)
import { supabase } from './supabase'

export class DebugService {
  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Database connection failed:', error)
        return false
      }

      console.log('✅ Database connection successful')
      return true
    } catch (err) {
      console.error('❌ Database connection error:', err)
      return false
    }
  }

  // Check if tables exist
  static async checkTables() {
    const tables = ['profiles', 'capsules', 'activity_log']
    const results: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1)

        results[table] = !error
        if (error) {
          console.error(`❌ Table '${table}' issue:`, error.message)
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
        }
      } catch (err) {
        results[table] = false
        console.error(`❌ Table '${table}' error:`, err)
      }
    }

    return results
  }

  // Check current user
  static async checkCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('❌ Auth error:', error)
        return null
      }

      if (!user) {
        console.log('❌ No authenticated user')
        return null
      }

      console.log('✅ Current user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('❌ Profile error:', profileError)
      } else {
        console.log('✅ User profile:', profile)
      }

      return { user, profile }
    } catch (err) {
      console.error('❌ User check error:', err)
      return null
    }
  }

  // Test capsule creation
  static async testCapsuleCreation() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No user authenticated for capsule test')
        return false
      }

      const testCapsule = {
        user_id: user.id,
        title: 'Test Capsule',
        description: 'This is a test capsule',
        data_types: ['text', 'images'],
        content: { test: true },
        metadata: { 
          itemCount: 0, 
          totalSize: 0, 
          tags: ['test'], 
          securityLevel: 'medium',
          category: 'Test',
          aiTags: [],
          version: 1
        },
        sharing: { 
          isShared: false, 
          sharedWith: [],
          emergencyContacts: [],
          publicAccess: false
        },
        security: { 
          encryptionEnabled: true,
          passwordProtected: false,
          biometricLock: false,
          accessLogging: true
        }
      }

      console.log('🧪 Testing capsule creation with:', testCapsule)

      const { data, error } = await supabase
        .from('capsules')
        .insert(testCapsule)
        .select()

      if (error) {
        console.error('❌ Capsule creation failed:', error)
        return false
      }

      console.log('✅ Test capsule created successfully:', data)

      // Clean up - delete the test capsule
      if (data && data[0]) {
        await supabase
          .from('capsules')
          .delete()
          .eq('id', data[0].id)
        console.log('🧹 Test capsule cleaned up')
      }

      return true
    } catch (err) {
      console.error('❌ Capsule test error:', err)
      return false
    }
  }

  // Run all debug checks
  static async runAllChecks() {
    console.log('🔍 Starting database debug checks...')
    
    const connection = await this.testConnection()
    const tables = await this.checkTables()
    const user = await this.checkCurrentUser()
    const capsuleTest = await this.testCapsuleCreation()

    const summary = {
      connection,
      tables,
      user: !!user,
      capsuleTest
    }

    console.log('📊 Debug Summary:', summary)
    return summary
  }
}
