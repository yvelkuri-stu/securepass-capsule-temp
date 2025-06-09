// 📁 src/lib/secure-capsules.ts (NEW - Complete encryption integration)
import { supabase } from './supabase'
import { EnhancedCryptoService } from './enhanced-crypto'
import { Capsule } from '@/types'

export interface SecureCapsule extends Omit<Capsule, 'content'> {
  content: any // Will be encrypted/decrypted automatically
  isEncrypted: boolean
  passwordHash?: string
  encryptionSalt?: string
  encryptionIV?: string
}

export class SecureCapsuleService {
  // Create or update a capsule with optional encryption
  static async saveCapsule(
    capsuleData: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>,
    password?: string,
    capsuleId?: string
  ): Promise<SecureCapsule> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let encryptedContent = capsuleData.content
    let isEncrypted = false
    let passwordHash = undefined
    let encryptionSalt = undefined
    let encryptionIV = undefined

    // If password provided, encrypt the content
    if (password) {
      console.log('🔒 Encrypting capsule content...')
      
      const contentString = JSON.stringify(capsuleData.content)
      const encryptionResult = await EnhancedCryptoService.encryptText(contentString, password)
      
      encryptedContent = {
        encrypted: true,
        data: encryptionResult.encryptedData
      }
      
      isEncrypted = true
      passwordHash = encryptionResult.keyHash
      encryptionSalt = encryptionResult.salt
      encryptionIV = encryptionResult.iv
      
      console.log('✅ Content encrypted successfully')
    }

    const dbCapsule = {
      user_id: user.id,
      title: capsuleData.title,
      description: capsuleData.description,
      data_types: capsuleData.dataTypes,
      content: encryptedContent,
      metadata: {
        ...capsuleData.metadata,
        isEncrypted,
        passwordHash,
        encryptionSalt,
        encryptionIV
      },
      sharing: capsuleData.sharing,
      security: {
        ...capsuleData.security,
        passwordProtected: !!password,
        encryptionEnabled: isEncrypted
      },
      last_accessed_at: new Date().toISOString()
    }

    let result
    if (capsuleId) {
      // Update existing capsule
      const { data, error } = await supabase
        .from('capsules')
        .update(dbCapsule)
        .eq('id', capsuleId)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new capsule
      const { data, error } = await supabase
        .from('capsules')
        .insert(dbCapsule)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return this.transformFromDB(result)
  }

  // Get a capsule and decrypt if needed
  static async getCapsule(capsuleId: string, password?: string): Promise<SecureCapsule> {
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', capsuleId)
      .single()

    if (error) throw error

    const capsule = this.transformFromDB(data)

    // If capsule is encrypted, decrypt the content
    if (capsule.isEncrypted && capsule.content?.encrypted) {
      if (!password) {
        throw new Error('Password required to decrypt capsule')
      }

      console.log('🔓 Decrypting capsule content...')
      
      try {
        const decryptedContent = await EnhancedCryptoService.decryptText({
          encryptedData: capsule.content.data,
          iv: capsule.encryptionIV!,
          salt: capsule.encryptionSalt!,
          password
        })
        
        capsule.content = JSON.parse(decryptedContent)
        console.log('✅ Content decrypted successfully')
        
      } catch (error) {
        console.error('❌ Decryption failed:', error)
        throw new Error('Invalid password or corrupted data')
      }
    }

    // Update last accessed
    await supabase
      .from('capsules')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', capsuleId)

    return capsule
  }

  // Get all capsules for user (content remains encrypted)
  static async getUserCapsules(): Promise<SecureCapsule[]> {
    const { data, error } = await supabase
      .from('capsules')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data || []).map(this.transformFromDB)
  }

  // Verify password for a capsule
  static async verifyPassword(capsuleId: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('capsules')
      .select('metadata')
      .eq('id', capsuleId)
      .single()

    if (error) return false

    const { passwordHash, encryptionSalt } = data.metadata || {}
    if (!passwordHash || !encryptionSalt) return false

    return EnhancedCryptoService.verifyPassword(password, encryptionSalt, passwordHash)
  }

  // Add password protection to existing capsule
  static async addPasswordProtection(
    capsuleId: string, 
    password: string
  ): Promise<void> {
    console.log('🔒 Adding password protection to capsule...')
    
    // First, get the current capsule
    const { data: currentCapsule, error: fetchError } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', capsuleId)
      .single()

    if (fetchError) throw fetchError

    // Encrypt the current content
    const contentString = JSON.stringify(currentCapsule.content)
    const encryptionResult = await EnhancedCryptoService.encryptText(contentString, password)

    const encryptedContent = {
      encrypted: true,
      data: encryptionResult.encryptedData
    }

    // Update the capsule with encrypted content and password info
    const { error: updateError } = await supabase
      .from('capsules')
      .update({
        content: encryptedContent,
        metadata: {
          ...currentCapsule.metadata,
          isEncrypted: true,
          passwordHash: encryptionResult.keyHash,
          encryptionSalt: encryptionResult.salt,
          encryptionIV: encryptionResult.iv
        },
        security: {
          ...currentCapsule.security,
          passwordProtected: true,
          encryptionEnabled: true
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', capsuleId)

    if (updateError) throw updateError
    
    console.log('✅ Password protection added successfully')
  }

  // Remove password protection from capsule
  static async removePasswordProtection(
    capsuleId: string, 
    currentPassword: string
  ): Promise<void> {
    console.log('🔓 Removing password protection from capsule...')
    
    // First decrypt the content
    const capsule = await this.getCapsule(capsuleId, currentPassword)

    // Update with decrypted content and remove password info
    const { error } = await supabase
      .from('capsules')
      .update({
        content: capsule.content,
        metadata: {
          ...capsule.metadata,
          isEncrypted: false,
          passwordHash: null,
          encryptionSalt: null,
          encryptionIV: null
        },
        security: {
          ...capsule.security,
          passwordProtected: false,
          encryptionEnabled: false
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', capsuleId)

    if (error) throw error
    
    console.log('✅ Password protection removed successfully')
  }

  // Update capsule content (handles encryption automatically)
  static async updateCapsuleContent(
    capsuleId: string,
    newContent: any,
    password?: string
  ): Promise<void> {
    const { data: capsule, error: fetchError } = await supabase
      .from('capsules')
      .select('metadata, security')
      .eq('id', capsuleId)
      .single()

    if (fetchError) throw fetchError

    let contentToStore = newContent

    // If capsule is encrypted, encrypt the new content
    if (capsule.metadata?.isEncrypted && password) {
      const contentString = JSON.stringify(newContent)
      const encryptionResult = await EnhancedCryptoService.encryptText(contentString, password)
      
      contentToStore = {
        encrypted: true,
        data: encryptionResult.encryptedData
      }
    }

    const { error: updateError } = await supabase
      .from('capsules')
      .update({
        content: contentToStore,
        updated_at: new Date().toISOString()
      })
      .eq('id', capsuleId)

    if (updateError) throw updateError
  }

  // Transform database record to app format
  private static transformFromDB(dbCapsule: any): SecureCapsule {
    const metadata = dbCapsule.metadata || {}
    
    return {
      id: dbCapsule.id,
      userId: dbCapsule.user_id,
      title: dbCapsule.title,
      description: dbCapsule.description,
      dataTypes: dbCapsule.data_types || [],
      content: dbCapsule.content || {},
      metadata: {
        itemCount: metadata.itemCount || 0,
        totalSize: metadata.totalSize || 0,
        tags: metadata.tags || [],
        category: metadata.category || 'Personal',
        aiTags: metadata.aiTags || [],
        securityLevel: metadata.securityLevel || 'medium',
        version: metadata.version || 1,
        ...metadata
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
      lastAccessedAt: new Date(dbCapsule.last_accessed_at),
      isEncrypted: metadata.isEncrypted || false,
      passwordHash: metadata.passwordHash,
      encryptionSalt: metadata.encryptionSalt,
      encryptionIV: metadata.encryptionIV
    }
  }
}
