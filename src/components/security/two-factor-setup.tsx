
// 📁 src/components/security/two-factor-setup.tsx (NEW - 2FA Component)
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Smartphone, 
  QrCode, 
  Shield, 
  Copy, 
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface TwoFactorSetupProps {
  isEnabled: boolean
  onToggle: (enabled: boolean, backupCodes?: string[]) => void
}

export function TwoFactorSetup({ isEnabled, onToggle }: TwoFactorSetupProps) {
  const [showSetup, setShowSetup] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [isVerifying, setIsVerifying] = useState(false)
  const [step, setStep] = useState(1)

  const generateTwoFactorSecret = async () => {
    // In a real app, this would call your backend
    const mockSecret = 'JBSWY3DPEHPK3PXP' // Mock TOTP secret
    const appName = 'SecurePass Capsule'
    const userEmail = 'user@example.com' // Get from auth context
    
    setSecret(mockSecret)
    setQrCodeUrl(`otpauth://totp/${appName}:${userEmail}?secret=${mockSecret}&issuer=${appName}`)
    
    // Generate backup codes
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    )
    setBackupCodes(codes)
  }

  const handleSetupStart = async () => {
    setShowSetup(true)
    setStep(1)
    await generateTwoFactorSecret()
  }

  const handleVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }

    setIsVerifying(true)
    
    try {
      // In a real app, verify the TOTP code with your backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock verification success
      if (verificationCode === '123456' || verificationCode.length === 6) {
        setStep(3) // Show backup codes
        toast.success('2FA verification successful!')
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error) {
      toast.error('Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleComplete = () => {
    onToggle(true, backupCodes)
    setShowSetup(false)
    setStep(1)
    setVerificationCode('')
    toast.success('Two-factor authentication enabled!')
  }

  const handleDisable = () => {
    const confirmed = window.confirm(
      'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
    )
    
    if (confirmed) {
      onToggle(false)
      toast.success('Two-factor authentication disabled')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Two-Factor Authentication
            </CardTitle>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isEnabled ? (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <strong>Two-factor authentication is disabled.</strong>
                    <br />
                    Enable 2FA to add an extra layer of security to your account.
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Benefits of 2FA:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Protects against password theft</li>
                  <li>• Secure access even on untrusted devices</li>
                  <li>• Compatible with popular authenticator apps</li>
                  <li>• Backup codes for emergency access</li>
                </ul>
              </div>

              <Button onClick={handleSetupStart} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm text-green-700">
                    <strong>Two-factor authentication is active.</strong>
                    <br />
                    Your account is protected with an additional security layer.
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  View Backup Codes
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDisable}
                  className="flex-1"
                >
                  Disable 2FA
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Step {step} of 3: Set up 2FA with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {step === 1 && (
              <>
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 border rounded-lg">
                    {qrCodeUrl ? (
                      <div className="space-y-2">
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center mx-auto rounded">
                          <QrCode className="h-16 w-16 text-gray-400" />
                          <span className="text-xs text-gray-500 ml-2">QR Code</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Scan this QR code with your authenticator app
                        </p>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 flex items-center justify-center mx-auto rounded">
                        <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Or enter this secret manually:</Label>
                    <div className="flex items-center space-x-2">
                      <Input value={secret} readOnly className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Recommended apps:</p>
                  <ul className="space-y-1">
                    <li>• Google Authenticator</li>
                    <li>• Microsoft Authenticator</li>
                    <li>• Authy</li>
                  </ul>
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Continue to Verification
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">Verification Code</Label>
                    <Input
                      id="verification-code"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <Button
                    onClick={handleVerification}
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="w-full"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-medium">Almost Done!</h3>
                    <p className="text-sm text-muted-foreground">
                      Save these backup codes in a secure location
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="p-2 bg-white rounded text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(backupCodes.join('\n'))}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Codes
                    </Button>
                    <Button onClick={handleComplete} className="flex-1">
                      Complete Setup
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <strong>Important:</strong> Each backup code can only be used once. 
                    Store them securely - you'll need them if you lose access to your authenticator app.
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
