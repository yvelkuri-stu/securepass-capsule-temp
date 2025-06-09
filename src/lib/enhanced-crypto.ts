// 📁 src/lib/enhanced-crypto.ts (Enhanced encryption for files)
import CryptoJS from 'crypto-js'

export interface EncryptionResult {
  encryptedData: string
  iv: string
  salt: string
  keyHash: string
}

export interface DecryptionParams {
  encryptedData: string
  iv: string
  salt: string
  password: string
}

export interface FileEncryptionResult {
  encryptedFile: Blob
  metadata: {
    iv: string
    salt: string
    keyHash: string
    originalName: string
    originalSize: number
    originalType: string
  }
}

export class EnhancedCryptoService {
  private static readonly ALGORITHM = 'AES'
  private static readonly KEY_SIZE = 256
  private static readonly ITERATIONS = 100000 // Increased for better security
  private static readonly CHUNK_SIZE = 1024 * 1024 // 1MB chunks for large files

  // Generate a cryptographically secure password
  static generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => charset[byte % charset.length]).join('')
  }

  // Generate a secure salt
  static generateSalt(length: number = 32): string {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Generate initialization vector
  static generateIV(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString()
  }

  // Derive encryption key from password
  static async deriveKey(password: string, salt: string): Promise<string> {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS,
      hasher: CryptoJS.algo.SHA256
    })
    return key.toString()
  }

  // Encrypt text data
  static async encryptText(text: string, password: string): Promise<EncryptionResult> {
    const salt = this.generateSalt()
    const iv = this.generateIV()
    const key = await this.deriveKey(password, salt)
    
    const encrypted = CryptoJS.AES.encrypt(text, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    const keyHash = CryptoJS.SHA256(key).toString()
    
    return {
      encryptedData: encrypted.toString(),
      iv,
      salt,
      keyHash
    }
  }

  // Decrypt text data
  static async decryptText(params: DecryptionParams): Promise<string> {
    const key = await this.deriveKey(params.password, params.salt)
    
    const decrypted = CryptoJS.AES.decrypt(params.encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(params.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    const result = decrypted.toString(CryptoJS.enc.Utf8)
    if (!result) {
      throw new Error('Decryption failed - invalid password or corrupted data')
    }
    
    return result
  }

  // Encrypt file with progress callback
  static async encryptFile(
    file: File, 
    password: string, 
    onProgress?: (progress: number) => void
  ): Promise<FileEncryptionResult> {
    const salt = this.generateSalt()
    const iv = this.generateIV()
    const key = await this.deriveKey(password, salt)
    const keyHash = CryptoJS.SHA256(key).toString()

    // For small files, encrypt directly
    if (file.size < this.CHUNK_SIZE) {
      const arrayBuffer = await file.arrayBuffer()
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
      
      const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      
      const encryptedBytes = this.base64ToUint8Array(encrypted.toString())
      const encryptedFile = new Blob([encryptedBytes], { type: 'application/octet-stream' })
      
      onProgress?.(100)
      
      return {
        encryptedFile,
        metadata: {
          iv,
          salt,
          keyHash,
          originalName: file.name,
          originalSize: file.size,
          originalType: file.type
        }
      }
    }

    // For large files, encrypt in chunks
    return this.encryptFileInChunks(file, key, iv, salt, keyHash, onProgress)
  }

  // Encrypt large files in chunks
  private static async encryptFileInChunks(
    file: File,
    key: string,
    iv: string,
    salt: string,
    keyHash: string,
    onProgress?: (progress: number) => void
  ): Promise<FileEncryptionResult> {
    const chunks: Uint8Array[] = []
    const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE)
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.CHUNK_SIZE
      const end = Math.min(start + this.CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      const arrayBuffer = await chunk.arrayBuffer()
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
      
      const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      })
      
      const encryptedBytes = this.base64ToUint8Array(encrypted.toString())
      chunks.push(encryptedBytes)
      
      const progress = ((i + 1) / totalChunks) * 100
      onProgress?.(progress)
    }
    
    const encryptedFile = new Blob(chunks, { type: 'application/octet-stream' })
    
    return {
      encryptedFile,
      metadata: {
        iv,
        salt,
        keyHash,
        originalName: file.name,
        originalSize: file.size,
        originalType: file.type
      }
    }
  }

  // Decrypt file
  static async decryptFile(
    encryptedBlob: Blob,
    metadata: FileEncryptionResult['metadata'],
    password: string,
    onProgress?: (progress: number) => void
  ): Promise<File> {
    const key = await this.deriveKey(password, metadata.salt)
    const keyHash = CryptoJS.SHA256(key).toString()
    
    // Verify password
    if (keyHash !== metadata.keyHash) {
      throw new Error('Invalid password')
    }
    
    const encryptedData = await encryptedBlob.arrayBuffer()
    const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedData)
    
    const decrypted = CryptoJS.AES.decrypt(encryptedWordArray.toString(CryptoJS.enc.Base64), key, {
      iv: CryptoJS.enc.Hex.parse(metadata.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    })
    
    if (!decrypted.sigBytes) {
      throw new Error('Decryption failed')
    }
    
    const decryptedBytes = this.wordArrayToUint8Array(decrypted)
    const decryptedFile = new File([decryptedBytes], metadata.originalName, {
      type: metadata.originalType
    })
    
    onProgress?.(100)
    return decryptedFile
  }

  // Verify password against hash
  static async verifyPassword(password: string, salt: string, keyHash: string): Promise<boolean> {
    try {
      const key = await this.deriveKey(password, salt)
      const computedHash = CryptoJS.SHA256(key).toString()
      return computedHash === keyHash
    } catch {
      return false
    }
  }

  // Generate capsule-specific encryption key
  static async generateCapsuleKey(userPassword: string, capsuleId: string): Promise<string> {
    const salt = `capsule_${capsuleId}`
    return this.deriveKey(userPassword, salt)
  }

  // Secure key storage using Web Crypto API (where available)
  static async storeKeySecurely(keyName: string, key: string): Promise<void> {
    if ('crypto' in window && 'subtle' in window.crypto) {
      try {
        // Store in IndexedDB with Web Crypto API encryption
        const encoder = new TextEncoder()
        const data = encoder.encode(key)
        
        // Generate a key for local encryption
        const cryptoKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        )
        
        // This is a simplified version - in production you'd want to derive from user auth
        localStorage.setItem(`encrypted_key_${keyName}`, JSON.stringify({
          encrypted: Array.from(new Uint8Array(await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: new Uint8Array(12) },
            cryptoKey,
            data
          ))),
          timestamp: Date.now()
        }))
      } catch (error) {
        // Fallback to less secure storage
        console.warn('Secure key storage failed, using fallback:', error)
        sessionStorage.setItem(`key_${keyName}`, key)
      }
    } else {
      // Fallback for browsers without Web Crypto API
      sessionStorage.setItem(`key_${keyName}`, key)
    }
  }

  // Retrieve securely stored key
  static async getStoredKey(keyName: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(`encrypted_key_${keyName}`)
      if (stored) {
        // Implementation would decrypt using Web Crypto API
        // For now, fallback to session storage
      }
      
      return sessionStorage.getItem(`key_${keyName}`)
    } catch {
      return null
    }
  }

  // Utility functions
  private static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  private static wordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
    const arrayOfWords = wordArray.hasOwnProperty('words') ? wordArray.words : []
    const length = wordArray.hasOwnProperty('sigBytes') ? wordArray.sigBytes : arrayOfWords.length * 4
    const uInt8Array = new Uint8Array(length)
    
    let index = 0
    for (let word = 0; word < arrayOfWords.length; word++) {
      const wordValue = arrayOfWords[word]
      for (let byte = 3; byte >= 0; byte--) {
        if (index < length) {
          uInt8Array[index++] = (wordValue >> (8 * byte)) & 0xFF
        }
      }
    }
    
    return uInt8Array
  }

  // Password strength checker
  static checkPasswordStrength(password: string): {
    score: number
    feedback: string[]
    isStrong: boolean
  } {
    const feedback: string[] = []
    let score = 0

    if (password.length >= 12) score += 2
    else if (password.length >= 8) score += 1
    else feedback.push('Use at least 8 characters')

    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Include lowercase letters')

    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Include uppercase letters')

    if (/\d/.test(password)) score += 1
    else feedback.push('Include numbers')

    if (/[^A-Za-z0-9]/.test(password)) score += 2
    else feedback.push('Include special characters')

    if (password.length >= 16) score += 1
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password)) score += 1

    return {
      score: Math.min(score, 8),
      feedback,
      isStrong: score >= 6
    }
  }
}