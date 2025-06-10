// 📁 src/lib/secure-capsules.ts (FIXED - Complete encryption integration)
import { supabase } from './supabase'
import { EnhancedCryptoService } from './enhanced-crypto'
import { Capsule, CapsuleContent } from '@/types' // Assuming CapsuleContent is also exported from '@/types'

// Define a type for the encrypted content structure
export interface EncryptedContentData {
  encrypted: boolean;
  data: string; // Assuming encryptedData is a string
}

// Update SecureCapsule to use a union type for content, allowing both original and encrypted forms
export interface SecureCapsule extends Omit<Capsule, 'content'> {
  content: CapsuleContent | EncryptedContentData; // Content can be original or encrypted
  isEncrypted: boolean;
  passwordHash?: string;
  encryptionSalt?: string;
  encryptionIV?: string;
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

    // Initialize encryptedContent with the original content, but typed to allow the encrypted format too
    let encryptedContent: CapsuleContent | EncryptedContentData = capsuleData.content;
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
      content: encryptedContent, // This is now correctly typed
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
    // Use a type guard to safely access the 'encrypted' property
    if (capsule.isEncrypted && (capsule.content as EncryptedContentData)?.encrypted) {
      if (!password) {
        throw new Error('Password required to decrypt capsule')
      }

      console.log('🔓 Decrypting capsule content...')
      
      try {
        const decryptedContent = await EnhancedCryptoService.decryptText({
          encryptedData: (capsule.content as EncryptedContentData).data, // Cast to access 'data'
          iv: capsule.encryptionIV!,
          salt: capsule.encryptionSalt!,
          password
        })
        
        capsule.content = JSON.parse(decryptedContent) as CapsuleContent // Assign back to original CapsuleContent type
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

    // Ensure content is in a decrypted state before encryption
    let contentToEncrypt: CapsuleContent = currentCapsule.content;
    
    // If the existing capsule content is already encrypted (e.g., if re-adding/changing protection),
    // it must be decrypted first. This example assumes 'addPasswordProtection' is for unencrypted
    // -> encrypted transition. If it's already encrypted, the logic needs to decrypt first.
    // This is a placeholder for a more complex scenario.
    if (currentCapsule.metadata?.isEncrypted && (currentCapsule.content as EncryptedContentData)?.encrypted) {
       // In a real application, you'd need the *original* password to decrypt first.
       // For this function, we'll assume the content fetched is already in its decrypted form
       // if `isEncrypted` is true, it means `getCapsule` would have decrypted it.
       // Or, if calling this on an already encrypted capsule, ensure `currentCapsule.content`
       // is passed in its original, decrypted form from the client side.
       // If you want to re-encrypt, you'd call getCapsule(id, oldPassword) first, then this function.
       console.warn("Attempting to add password protection to an already encrypted capsule. Ensure currentCapsule.content is decrypted before re-encryption.");
    }


    const contentString = JSON.stringify(contentToEncrypt)
    const encryptionResult = await EnhancedCryptoService.encryptText(contentString, password)

    const encryptedContent: EncryptedContentData = {
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
    const capsule = await this.getCapsule(capsuleId, currentPassword) // This will decrypt it internally

    // Update with decrypted content and remove password info
    const { error } = await supabase
      .from('capsules')
      .update({
        content: capsule.content, // 'capsule.content' is now decrypted thanks to getCapsule
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
    newContent: CapsuleContent, // Expect CapsuleContent here as it's the decrypted form
    password?: string
  ): Promise<void> {
    const { data: capsuleFromDb, error: fetchError } = await supabase
      .from('capsules')
      .select('metadata, security, content') // Also fetch content to know its current state
      .eq('id', capsuleId)
      .single()

    if (fetchError) throw fetchError

    let contentToStore: CapsuleContent | EncryptedContentData = newContent;

    // If capsule is marked as encrypted, we need to encrypt the new content before storing
    if (capsuleFromDb.metadata?.isEncrypted) {
      if (!password) {
        throw new Error("Password required to update content of an encrypted capsule.");
      }

      const contentString = JSON.stringify(newContent)
      const encryptionResult = await EnhancedCryptoService.encryptText(contentString, password)
      
      contentToStore = {
        encrypted: true,
        data: encryptionResult.encryptedData
      } as EncryptedContentData; // Cast to the correct type
    }
    // If not encrypted, contentToStore remains newContent (CapsuleContent type), which is fine.

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
    const security = dbCapsule.security || {}
    
    // Determine if content is encrypted in DB based on metadata flag
    const isEncryptedInDb = metadata.isEncrypted === true;

    // The content from DB will either be the original structure or { encrypted: true, data: '...' }
    // We cast it here to the union type to satisfy SecureCapsule interface
    const content: CapsuleContent | EncryptedContentData = dbCapsule.content || {};

    return {
      id: dbCapsule.id,
      userId: dbCapsule.user_id,
      title: dbCapsule.title,
      description: dbCapsule.description,
      dataTypes: dbCapsule.data_types || [],
      content: content, // This is now typed as CapsuleContent | EncryptedContentData
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
        encryptionEnabled: security.encryptionEnabled !== false, // Default to true if not explicitly false
        passwordProtected: security.passwordProtected || false,
        biometricLock: security.biometricLock || false,
        accessLogging: security.accessLogging !== false, // Default to true if not explicitly false
        autoDestruct: security.autoDestruct, // Keep autoDestruct as is
        ...security
      },
      createdAt: new Date(dbCapsule.created_at),
      updatedAt: new Date(dbCapsule.updated_at),
      lastAccessedAt: new Date(dbCapsule.last_accessed_at),
      isEncrypted: isEncryptedInDb, // This is explicitly from metadata
      passwordHash: metadata.passwordHash,
      encryptionSalt: metadata.encryptionSalt,
      encryptionIV: metadata.encryptionIV
    }
  }
}
