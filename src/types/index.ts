// 📁 src/types/index.ts
export interface User {
  id: string
  email: string
  displayName: string
  profilePicture?: string
  createdAt: Date
  lastLoginAt: Date
  mfaEnabled: boolean
  securityScore: number
}

export interface Capsule {
  id: string
  userId: string
  title: string
  description?: string
  dataTypes: DataType[]
  content: CapsuleContent
  metadata: CapsuleMetadata
  sharing: SharingSettings
  security: SecuritySettings
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
}

export interface CapsuleContent {
  text?: string
  images?: FileAttachment[]
  videos?: FileAttachment[]
  attachments?: FileAttachment[]
  qrCodes?: QRCode[]
  voiceNotes?: VoiceNote[]
}

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
  encryptedUrl: string
  thumbnail?: string
  uploadedAt: Date
}

export interface QRCode {
  id: string
  data: string
  type: 'url' | 'text' | 'wifi' | 'contact'
  generatedAt: Date
}

export interface VoiceNote {
  id: string
  duration: number
  transcription?: string
  url: string
  encryptedUrl: string
  recordedAt: Date
}

export interface CapsuleMetadata {
  itemCount: number
  totalSize: number
  tags: string[]
  category: string
  aiTags: string[]
  securityLevel: SecurityLevel
  version: number
}

export interface SharingSettings {
  isShared: boolean
  sharedWith: SharedContact[]
  emergencyContacts: EmergencyContact[]
  publicAccess: boolean
  expiresAt?: Date
}

export interface SharedContact {
  email: string
  permissions: Permission[]
  sharedAt: Date
  accessedAt?: Date
  expiresAt?: Date
}

export interface EmergencyContact {
  email: string
  name: string
  relationship: string
  activationDelay: number // hours
  conditions: EmergencyCondition[]
}

export interface SecuritySettings {
  encryptionEnabled: boolean
  passwordProtected: boolean
  biometricLock: boolean
  accessLogging: boolean
  autoDestruct?: AutoDestructSettings
}

export interface AutoDestructSettings {
  enabled: boolean
  maxAccess: number
  expiresAt: Date
  currentAccess: number
}

export type DataType = 'text' | 'images' | 'videos' | 'attachments' | 'qrCodes' | 'voiceNotes'
export type SecurityLevel = 'low' | 'medium' | 'high' | 'maximum'
export type Permission = 'view' | 'download' | 'edit' | 'share'
export type EmergencyCondition = 'inactivity' | 'manual' | 'scheduled'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface DashboardStats {
  totalCapsules: number
  sharedItems: number
  pendingAlerts: number
  securityScore: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'created' | 'accessed' | 'shared' | 'modified'
  capsuleId: string
  capsuleTitle: string
  timestamp: Date
  description: string
}


//From gemini start
// src/types/service-worker.d.ts or src/types/global.d.ts
// If this is a .ts file (not .d.ts), wrap global declarations in 'declare global'
declare global {
  interface SyncEvent extends Event {
    readonly lastChance: boolean;
    readonly tag: string;
  }

  // Declares the SyncManager class available globally
  class SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }

  // Extends the ServiceWorkerRegistration interface to include the 'sync' property
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  // Extends the Window interface to ensure ServiceWorkerRegistration is known on navigator
  interface Window {
    ServiceWorkerRegistration: ServiceWorkerRegistration;
  }
}
//From gemini end
