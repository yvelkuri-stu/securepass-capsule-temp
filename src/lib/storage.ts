// 📁 src/lib/storage.ts (UPDATED with missing methods)
import { supabase } from './supabase'

export interface FileUploadResult {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  storagePath: string
  thumbnailPath?: string
  url: string
}

export class StorageService {
  private static readonly BUCKET_NAME = 'capsule-files'
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
  
  private static readonly ALLOWED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]

  // Upload file to Supabase Storage
  static async uploadFile(
    file: File, 
    capsuleId: string, 
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    // Validate file
    this.validateFile(file)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${user.id}/${capsuleId}/${fileName}`

    console.log('Uploading file:', { fileName: file.name, size: file.size, type: file.type, path: filePath })

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log('File uploaded to storage:', uploadData)

    // Create thumbnail for images
    let thumbnailPath: string | undefined
    if (file.type.startsWith('image/')) {
      try {
        thumbnailPath = await this.createThumbnail(file, filePath, user.id, capsuleId)
      } catch (err) {
        console.warn('Thumbnail creation failed:', err)
      }
    }

    // Save file metadata to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        capsule_id: capsuleId,
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        thumbnail_path: thumbnailPath
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(this.BUCKET_NAME).remove([filePath])
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.log('File metadata saved:', fileRecord)

    // Get signed URL for immediate access
    const { data: urlData } = await supabase.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    return {
      id: fileRecord.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      storagePath: filePath,
      thumbnailPath,
      url: urlData?.signedUrl || ''
    }
  }

  // ADDED: Update file metadata (for encryption info)
  static async updateFileMetadata(fileId: string, metadata: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .update(metadata)
        .eq('id', fileId)

      if (error) {
        console.warn('Failed to update file metadata:', error)
        // Don't throw - this is optional metadata
      }
    } catch (err) {
      console.warn('File metadata update failed:', err)
    }
  }

  // Create thumbnail for images
  private static async createThumbnail(
    file: File, 
    originalPath: string, 
    userId: string, 
    capsuleId: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = async () => {
        // Calculate thumbnail dimensions (max 200px)
        const maxSize = 200
        const ratio = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        // Draw resized image
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create thumbnail blob'))
            return
          }

          // Upload thumbnail
          const thumbFileName = `thumb_${originalPath.split('/').pop()}`
          const thumbPath = `${userId}/${capsuleId}/thumbnails/${thumbFileName}`

          const { error } = await supabase.storage
            .from(this.BUCKET_NAME)
            .upload(thumbPath, blob, {
              cacheControl: '3600',
              upsert: false
            })

          if (error) {
            reject(error)
          } else {
            resolve(thumbPath)
          }
        }, 'image/jpeg', 0.8)
      }

      img.onerror = () => reject(new Error('Failed to load image for thumbnail'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Get files for a capsule
  static async getCapsuleFiles(capsuleId: string): Promise<FileUploadResult[]> {
    const { data, error } = await supabase
      .from('file_attachments')
      .select('*')
      .eq('capsule_id', capsuleId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get signed URLs for each file
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from(this.BUCKET_NAME)
          .createSignedUrl(file.storage_path, 3600)

        return {
          id: file.id,
          fileName: file.file_name,
          fileSize: file.file_size,
          fileType: file.file_type,
          storagePath: file.storage_path,
          thumbnailPath: file.thumbnail_path,
          url: urlData?.signedUrl || ''
        }
      })
    )

    return filesWithUrls
  }

  // Delete file
  static async deleteFile(fileId: string): Promise<void> {
    // Get file info first
    const { data: fileData, error: fetchError } = await supabase
      .from('file_attachments')
      .select('storage_path, thumbnail_path')
      .eq('id', fileId)
      .single()

    if (fetchError) throw fetchError

    // Delete from storage
    const pathsToDelete = [fileData.storage_path]
    if (fileData.thumbnail_path) {
      pathsToDelete.push(fileData.thumbnail_path)
    }

    const { error: storageError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove(pathsToDelete)

    if (storageError) {
      console.warn('Storage deletion warning:', storageError)
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_attachments')
      .delete()
      .eq('id', fileId)

    if (dbError) throw dbError
  }

  // Validate file before upload
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`)
    }
  }

  // Get storage usage for user
  static async getStorageUsage(): Promise<{ used: number; total: number }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('file_attachments')
      .select('file_size')
      .eq('user_id', user.id)

    if (error) throw error

    const used = (data || []).reduce((total, file) => total + file.file_size, 0)
    const total = 1024 * 1024 * 1024 // 1GB total storage per user

    return { used, total }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Get file type icon
  static getFileTypeIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.includes('word')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    return '📁'
  }
}