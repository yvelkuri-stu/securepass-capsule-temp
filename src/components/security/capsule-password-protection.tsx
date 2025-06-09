// 📁 src/components/security/capsule-password-protection.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  Lock, 
  Unlock, 
  Shield, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Fingerprint
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { EnhancedCryptoService } from '@/lib/enhanced-crypto'
import { toast } from 'sonner'

interface CapsulePasswordProtectionProps {
  capsuleId: string
  isProtected: boolean
  onProtectionChange: (isProtected: boolean, password?: string) => void
  onUnlock?: (password: string) => void
  showUnlockDialog?: boolean
  onUnlockDialogClose?: () => void
}

interface PasswordAttempt {
  timestamp: number
  success: boolean
}

export function CapsulePasswordProtection({
  capsuleId,
  isProtected,
  onProtectionChange,
  onUnlock,
  showUnlockDialog = false,
  onUnlockDialogClose
}: CapsulePasswordProtectionProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlockPassword, setUnlockPassword] = useState('')
  const [showUnlockPassword, setShowUnlockPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState<PasswordAttempt[]>([])
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [lockoutTimeRemaining, setLockoutTimeRemaining] = useState(0)

  const passwordStrength = password ? EnhancedCryptoService.checkPasswordStrength(password) : null
  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil

  // Load attempts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`capsule_attempts_${capsuleId}`)
    if (stored) {
      try {
        const parsedAttempts = JSON.parse(stored)
        setAttempts(parsedAttempts)
        
        // Check for lockout
        const recentFailures = parsedAttempts
          .filter((attempt: PasswordAttempt) => 
            !attempt.success && 
            Date.now() - attempt.timestamp < 30 * 60 * 1000 // 30 minutes
          )
        
        if (recentFailures.length >= 5) {
          const lockoutTime = recentFailures[recentFailures.length - 1].timestamp + 30 * 60 * 1000
          setLockoutUntil(lockoutTime)
        }
      } catch (error) {
        console.error('Failed to parse attempts:', error)
      }
    }
  }, [capsuleId])

  // Update lockout timer
  useEffect(() => {
    if (!lockoutUntil) return

    const timer = setInterval(() => {
      const remaining = Math.max(0, lockoutUntil - Date.now())
      setLockoutTimeRemaining(remaining)
      
      if (remaining === 0) {
        setLockoutUntil(null)
        // Clear old attempts
        setAttempts([])
        localStorage.removeItem(`capsule_attempts_${capsuleId}`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lockoutUntil, capsuleId])

  const recordAttempt = (success: boolean) => {
    const newAttempt: PasswordAttempt = {
      timestamp: Date.now(),
      success
    }
    
    const updatedAttempts = [...attempts, newAttempt]
    setAttempts(updatedAttempts)
    localStorage.setItem(`capsule_attempts_${capsuleId}`, JSON.stringify(updatedAttempts))
    
    if (!success) {
      const recentFailures = updatedAttempts
        .filter(attempt => 
          !attempt.success && 
          Date.now() - attempt.timestamp < 30 * 60 * 1000
        )
      
      if (recentFailures.length >= 5) {
        const lockoutTime = Date.now() + 30 * 60 * 1000 // 30 minute lockout
        setLockoutUntil(lockoutTime)
        toast.error('Too many failed attempts. Capsule locked for 30 minutes.')
      } else if (recentFailures.length >= 3) {
        toast.warning(`${5 - recentFailures.length} attempts remaining before lockout`)
      }
    }
  }

  const generateSecurePassword = () => {
    const newPassword = EnhancedCryptoService.generateSecurePassword(20)
    setPassword(newPassword)
    setConfirmPassword(newPassword)
    toast.success('Secure password generated!')
  }

  const handleSetPassword = async () => {
    if (!password) {
      toast.error('Please enter a password')
      return
    }

    if (!passwordStrength?.isStrong) {
      toast.error('Please use a stronger password')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    
    try {
      // In a real app, you'd save the password hash to the database
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      onProtectionChange(true, password)
      setPassword('')
      setConfirmPassword('')
      toast.success('Capsule password protection enabled!')
      
    } catch (error) {
      toast.error('Failed to set password protection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemovePassword = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to remove password protection? This will make your capsule less secure.'
    )
    
    if (!confirmed) return

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      onProtectionChange(false)
      toast.success('Password protection removed')
    } catch (error) {
      toast.error('Failed to remove password protection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockPassword) {
      toast.error('Please enter the capsule password')
      return
    }

    if (isLockedOut) {
      toast.error('Capsule is locked due to too many failed attempts')
      return
    }

    setIsLoading(true)
    
    try {
      // In a real app, you'd verify against the stored hash
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Simulate password verification
      const isValid = true // This would be actual verification
      
      if (isValid) {
        recordAttempt(true)
        onUnlock?.(unlockPassword)
        setUnlockPassword('')
        toast.success('Capsule unlocked!')
        onUnlockDialogClose?.()
      } else {
        recordAttempt(false)
        toast.error('Invalid password')
      }
      
    } catch (error) {
      recordAttempt(false)
      toast.error('Failed to unlock capsule')
    } finally {
      setIsLoading(false)
    }
  }

  const formatLockoutTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Password Protection
            </CardTitle>
            <Badge variant={isProtected ? 'default' : 'secondary'}>
              {isProtected ? 'Protected' : 'Unprotected'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isProtected ? (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <strong>Capsule is not password protected.</strong>
                    <br />
                    Anyone with access to your account can view this capsule's contents.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-20"
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="h-8 w-8"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={generateSecurePassword}
                        className="h-8 w-8"
                        title="Generate secure password"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Password Strength</span>
                        <span className={`font-medium ${
                          passwordStrength.isStrong ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {passwordStrength.isStrong ? 'Strong' : 'Weak'}
                        </span>
                      </div>
                      <Progress value={(passwordStrength.score / 8) * 100} className="h-1" />
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <Button
                  onClick={handleSetPassword}
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword || !passwordStrength?.isStrong}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Setting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Enable Password Protection
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <strong>Capsule is password protected.</strong>
                    <br />
                    A password is required to access this capsule's contents.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Protection Status</span>
                  <Badge variant="default">
                    <Lock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Recent Attempts</span>
                  <span>{attempts.filter(a => !a.success).length} failed</span>
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleRemovePassword}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Remove Password Protection
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Unlock Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={onUnlockDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary" />
              Capsule Locked
            </DialogTitle>
            <DialogDescription>
              This capsule is password protected. Enter the password to access its contents.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {isLockedOut ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <strong>Capsule Locked</strong>
                    <br />
                    Too many failed attempts. Try again in {formatLockoutTime(lockoutTimeRemaining)}.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unlock-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="unlock-password"
                      type={showUnlockPassword ? 'text' : 'password'}
                      placeholder="Enter capsule password"
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      className="pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                    >
                      {showUnlockPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {attempts.filter(a => !a.success).length > 0 && (
                  <div className="text-xs text-amber-600">
                    {attempts.filter(a => !a.success).length} failed attempt(s). 
                    {5 - attempts.filter(a => !a.success).length} remaining before lockout.
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={onUnlockDialogClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUnlock}
                    disabled={isLoading || !unlockPassword}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Unlocking...
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}