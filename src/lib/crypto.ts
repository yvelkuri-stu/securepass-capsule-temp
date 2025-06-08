// 📁 src/lib/crypto.ts
import CryptoJS from 'crypto-js'

export class CryptoService {
  private static readonly ALGORITHM = 'AES'
  private static readonly KEY_SIZE = 256
  private static readonly ITERATIONS = 10000

  static async deriveKey(password: string, salt: string): Promise<string> {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS
    })
    return key.toString()
  }

  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128/8).toString()
  }

  static encrypt(data: string, key: string): string {
    const encrypted = CryptoJS.AES.encrypt(data, key).toString()
    return encrypted
  }

  static decrypt(encryptedData: string, key: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key)
    return decrypted.toString(CryptoJS.enc.Utf8)
  }

  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = this.generateSalt()
    const hash = await this.deriveKey(password, salt)
    return { hash, salt }
  }

  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const derivedHash = await this.deriveKey(password, salt)
    return derivedHash === hash
  }
}

