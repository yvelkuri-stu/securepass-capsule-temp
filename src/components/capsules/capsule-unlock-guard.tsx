
// 📁 src/components/capsules/capsule-unlock-guard.tsx (NEW - Unlock protection)
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { SecureCapsuleService } from '@/lib/secure-capsules'
import { toast } from 'sonner'

interface CapsuleUnlockGuardProps {
  capsuleId: string
  isProtected: boolean
  children: (unlocked: boolean, password?: string) => React.ReactNode
}

export function CapsuleUnlockGuard({ 
  capsuleId, 
  isProtected, 
  children 
}: CapsuleUnlockGuardProps) {
  const [isUnlocked, setIsUnlocked] = useState(!isProtected)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [currentPassword, setCurrentPassword] = useState<string>()

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast.error('Please enter the capsule password')
      return
    }

    setIsVerifying(true)
    
    try {
      const isValid = await SecureCapsuleService.verifyPassword(capsuleId, password)
      
      if (isValid) {
        setIsUnlocked(true)
        setCurrentPassword(password)
        setPassword('')
        setAttempts(0)
        toast.success('Capsule unlocked!')
      } else {
        setAttempts(prev => prev + 1)
        toast.error('Invalid password')
        
        if (attempts >= 4) {
          toast.error('Too many failed attempts. Please try again later.')
          // In a real app, you might implement a temporary lockout
        }
      }
    } catch (error: any) {
      toast.error('Failed to verify password')
      setAttempts(prev => prev + 1)
    } finally {
      setIsVerifying(false)
    }
  }

  // If not protected or already unlocked, render children directly
  if (!isProtected || isUnlocked) {
    return <>{children(isUnlocked, currentPassword)}</>
  }

  // Show unlock dialog
  return (
    <>
      {children(false, undefined)}
      
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary" />
              Capsule Locked
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This capsule is password protected. Enter the password to access its contents.
            </p>

            {attempts > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {attempts} failed attempt{attempts > 1 ? 's' : ''}. 
                    {5 - attempts} remaining before lockout.
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unlock-password">Password</Label>
              <div className="relative">
                <Input
                  id="unlock-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter capsule password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  disabled={isVerifying || attempts >= 5}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  disabled={isVerifying}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleUnlock}
              disabled={isVerifying || !password.trim() || attempts >= 5}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock Capsule
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}