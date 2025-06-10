// 📁 src/lib/crypto.ts (Create this file - Basic crypto service)
import CryptoJS from 'crypto-js'

export class CryptoService {
  // Simple text encryption (keeping for compatibility)
  static encrypt(text: string, password: string): string {
    return CryptoJS.AES.encrypt(text, password).toString()
  }

  // Simple text decryption (keeping for compatibility)
  static decrypt(encryptedText: string, password: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedText, password)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // Generate a random key
  static generateKey(): string {
    return CryptoJS.lib.WordArray.random(256/8).toString()
  }

  // Hash a password
  static hash(text: string): string {
    return CryptoJS.SHA256(text).toString()
  }

  // Verify password against hash
  static verifyHash(text: string, hash: string): boolean {
    return this.hash(text) === hash
  }
}

// Re-export EnhancedCryptoService as the main service
export { EnhancedCryptoService as AdvancedCrypto } from './enhanced-crypto'