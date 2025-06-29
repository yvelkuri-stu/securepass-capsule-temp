// src/lib/env.ts
export function validateEnv() {
  // Only validate in browser environment or when explicitly needed
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    // Skip validation during build process in production
    return
  }

  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const missing = requiredEnvs.filter(env => !process.env[env])
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    
    // In development, throw error immediately
    if (process.env.NODE_ENV === 'development') {
      throw new Error(error)
    }
    
    // In production, log error but don't throw during build
    console.error(error)
    
    // Only throw in browser if variables are actually missing at runtime
    if (typeof window !== 'undefined') {
      throw new Error(error)
    }
  }
}

export function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

export function isEnvAvailable(): boolean {
  try {
    validateEnv()
    return true
  } catch {
    return false
  }
}