
// 📁 src/lib/file-storage.ts (NEW - Enhanced File Storage with Encryption)
import { supabase } from './supabase'
import { EnhancedCryptoService, FileEncryptionResult } from './enhanced-crypto'

export interface SecureFileUploadResult {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  storagePath: string
  thumbnailPath?: string
  url: string
  isEncrypted: boolean
  encryptionMetadata?: FileEncryptionResult['metadata']
}

export class SecureFileStorageService {
  private static readonly BUCKET_NAME = 'secure-capsule-files'
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  
  // Upload file with optional encryption
  static async uploadSecureFile(
    file: File, 
    capsuleId: string, 
    password?: string,
    onProgress?: (progress: number) => void
  ): Promise<SecureFileUploadResult> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    let fileToUpload = file
    let isEncrypted = false
    let encryptionMetadata: FileEncryptionResult['metadata'] | undefined

    // Encrypt file if password provided
    if (password) {
      console.log('🔒 Encrypting file before upload...')
      
      const encryptionResult = await EnhancedCryptoService.encryptFile(
        file,
        password,
        (progress) => onProgress?.(progress * 0.7) // 70% for encryption
      )
      
      fileToUpload = new File(
        [encryptionResult.encryptedFile], 
        `${file.name}.encrypted`,
        { type: 'application/octet-stream' }
      )
      
      isEncrypted = true
      encryptionMetadata = encryptionResult.metadata
      console.log('✅ File encrypted successfully')
    }

    // Generate unique file path
    const fileExt = isEncrypted ? 'encrypted' : file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/${capsuleId}/${fileName}`

    console.log('📤 Uploading file to storage...')

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    onProgress?.(90)

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        capsule_id: capsuleId,
        user_id: user.id,
        file_name: file.name, // Original filename
        file_size: file.size, // Original file size
        file_type: file.type, // Original file type
        storage_path: filePath,
        is_encrypted: isEncrypted,
        encryption_metadata: encryptionMetadata
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath])
      throw new Error(`Database error: ${dbError.message}`)
    }

    onProgress?.(100)

    // Get signed URL for immediate access
    const { data: urlData } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, 3600)

    console.log('✅ File upload completed')

    return {
      id: fileRecord.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: filePath,
      url: urlData?.signedUrl || '',
      isEncrypted,
      encryptionMetadata
    }
  }

  // Download and decrypt file
  static async downloadSecureFile(
    fileId: string,
    password?: string
  ): Promise<File> {
    // Get file metadata
    const { data: fileData, error: fetchError } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError) throw fetchError

    // Download file from storage
    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(fileData.storage_path)

    if (downloadError) throw downloadError

    // If file is encrypted, decrypt it
    if (fileData.is_encrypted && fileData.encryption_metadata) {
      if (!password) {
        throw new Error('Password required to decrypt file')
      }

      console.log('🔓 Decrypting downloaded file...')
      
      const decryptedFile = await EnhancedCryptoService.decryptFile(
        fileBlob,
        fileData.encryption_metadata,
        password
      )
      
      console.log('✅ File decrypted successfully')
      return decryptedFile
    }

    // Return file as-is if not encrypted
    return new File([fileBlob], fileData.file_name, {
      type: fileData.file_type
    })
  }

  // Update database schema for encrypted files
  static async createSecureFileTable(): Promise<void> {
    // This would be run in Supabase SQL editor
    const schema = `
      -- Add encryption columns to file_attachments table
      ALTER TABLE file_attachments 
      ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS encryption_metadata JSONB;
      
      -- Update RLS policies for file_attachments
      CREATE POLICY IF NOT EXISTS "Users can manage own file attachments"
        ON file_attachments FOR ALL
        USING (auth.uid() = user_id);
    `
    
    console.log('Run this SQL in Supabase:', schema)
  }
}
