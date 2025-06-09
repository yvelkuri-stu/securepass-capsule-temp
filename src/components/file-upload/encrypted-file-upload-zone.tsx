// 📁 src/components/file-upload/encrypted-file-upload-zone.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Upload, 
  Lock, 
  Unlock,
  Shield, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { StorageService } from '@/lib/storage'
import { EnhancedCryptoService } from '@/lib/enhanced-crypto'
import { toast } from 'sonner'

interface EncryptedFileUploadZoneProps {
  capsuleId: string
  onFileUploaded: (file: any) => void
  defaultEncryption?: boolean
  capsulePassword?: string
}

interface UploadingFile {
  name: string
  progress: number
  encrypted: boolean
  status: 'uploading' | 'encrypting' | 'complete' | 'error'
}

export function EncryptedFileUploadZone({
  capsuleId,
  onFileUploaded,
  defaultEncryption = true,
  capsulePassword
}: EncryptedFileUploadZoneProps) {
  const [encryptionEnabled, setEncryptionEnabled] = useState(defaultEncryption)
  const [password, setPassword] = useState(capsulePassword || '')
  const [showPassword, setShowPassword] = useState(false)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map())
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])

  const passwordStrength = password ? EnhancedCryptoService.checkPasswordStrength(password) : null

  const generateSecurePassword = () => {
    const newPassword = EnhancedCryptoService.generateSecurePassword(24)
    setPassword(newPassword)
    toast.success('Secure password generated!')
  }

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    if (rejectedFiles?.length > 0) {
      setRejectedFiles(rejectedFiles)
      setTimeout(() => setRejectedFiles([]), 5000)
    }

    if (acceptedFiles.length === 0) return

    // If encryption is enabled but no password is set, show dialog
    if (encryptionEnabled && !password) {
      setPendingFiles(acceptedFiles)
      setShowPasswordDialog(true)
      return
    }

    await processFiles(acceptedFiles)
  }, [encryptionEnabled, password])

  const processFiles = async (files: File[]) => {
    const newUploadingFiles = new Map<string, UploadingFile>()
    
    files.forEach(file => {
      newUploadingFiles.set(file.name, {
        name: file.name,
        progress: 0,
        encrypted: encryptionEnabled,
        status: 'uploading'
      })
    })
    
    setUploadingFiles(newUploadingFiles)

    for (const file of files) {
      try {
        let fileToUpload = file
        let isEncrypted = false
        let encryptionMetadata = null

        if (encryptionEnabled && password) {
          // Update status to encrypting
          setUploadingFiles(prev => new Map(prev.set(file.name, {
            ...prev.get(file.name)!,
            status: 'encrypting'
          })))

          // Encrypt the file
          const encryptionResult = await EnhancedCryptoService.encryptFile(
            file,
            password,
            (progress) => {
              setUploadingFiles(prev => new Map(prev.set(file.name, {
                ...prev.get(file.name)!,
                progress: progress * 0.5 // First 50% for encryption
              })))
            }
          )

          fileToUpload = new File([encryptionResult.encryptedFile], `${file.name}.encrypted`, {
            type: 'application/octet-stream'
          })
          
          isEncrypted = true
          encryptionMetadata = encryptionResult.metadata
        }

        // Update status to uploading
        setUploadingFiles(prev => new Map(prev.set(file.name, {
          ...prev.get(file.name)!,
          status: 'uploading'
        })))

        // Upload the file
        const result = await StorageService.uploadFile(fileToUpload, capsuleId)

        // If encrypted, store the metadata
        if (isEncrypted && encryptionMetadata) {
          // Store encryption metadata in database
          await StorageService.updateFileMetadata(result.id, {
            isEncrypted: true,
            encryptionMetadata: encryptionMetadata
          })
        }

        // Update progress to complete
        setUploadingFiles(prev => new Map(prev.set(file.name, {
          ...prev.get(file.name)!,
          progress: 100,
          status: 'complete'
        })))

        // Notify parent component
        onFileUploaded({
          ...result,
          isEncrypted,
          originalName: file.name,
          originalSize: file.size,
          originalType: file.type
        })

        toast.success(`${isEncrypted ? 'Encrypted and uploaded' : 'Uploaded'} ${file.name}`)

      } catch (error: any) {
        console.error('Upload error:', error)
        
        setUploadingFiles(prev => new Map(prev.set(file.name, {
          ...prev.get(file.name)!,
          status: 'error'
        })))
        
        toast.error(`Failed to upload ${file.name}: ${error.message}`)
      }
    }

    // Clear completed uploads after a delay
    setTimeout(() => {
      setUploadingFiles(new Map())
    }, 3000)
  }

  const handlePasswordDialogConfirm = async () => {
    if (!password && encryptionEnabled) {
      toast.error('Please enter a password for encryption')
      return
    }

    setShowPasswordDialog(false)
    await processFiles(pendingFiles)
    setPendingFiles([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 50 * 1024 * 1024,
    disabled: uploadingFiles.size > 0
  })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Files
              {encryptionEnabled && (
                <Badge variant="default" className="ml-2">
                  <Lock className="h-3 w-3 mr-1" />
                  Encrypted
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Encryption Settings */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-primary" />
                <Label htmlFor="encryption-toggle" className="font-medium">
                  Client-Side Encryption
                </Label>
              </div>
              <Switch
                id="encryption-toggle"
                checked={encryptionEnabled}
                onCheckedChange={setEncryptionEnabled}
              />
            </div>
            
            {encryptionEnabled && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-generate"
                    checked={autoGenerate}
                    onCheckedChange={setAutoGenerate}
                  />
                  <Label htmlFor="auto-generate" className="text-sm">
                    Auto-generate secure password
                  </Label>
                </div>

                {!autoGenerate && (
                  <div className="space-y-2">
                    <Label htmlFor="encryption-password">Encryption Password</Label>
                    <div className="relative">
                      <Input
                        id="encryption-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter encryption password"
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
                        >
                          <Shield className="h-4 w-4" />
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
                )}

                <div className="flex items-start space-x-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <Info className="h-3 w-3 mt-0.5" />
                  <div>
                    Files are encrypted in your browser before upload. 
                    {autoGenerate ? ' A secure password will be generated automatically.' : ' Store your password safely - it cannot be recovered if lost.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${uploadingFiles.size > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                {encryptionEnabled ? (
                  <Lock className="h-6 w-6 text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to select files
                </p>
                {encryptionEnabled && (
                  <p className="text-xs text-green-600 mt-1">
                    🔒 Files will be encrypted before upload
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadingFiles.size > 0 && (
            <div className="space-y-2">
              {Array.from(uploadingFiles.entries()).map(([fileName, fileInfo]) => (
                <div key={fileName} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {fileInfo.encrypted && <Lock className="h-3 w-3 text-green-500" />}
                      <span className="text-sm font-medium">{fileName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {fileInfo.status === 'complete' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {fileInfo.status === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {fileInfo.status === 'encrypting' ? 'Encrypting...' :
                         fileInfo.status === 'uploading' ? 'Uploading...' :
                         fileInfo.status === 'complete' ? 'Complete' : 'Error'}
                      </span>
                    </div>
                  </div>
                  <Progress value={fileInfo.progress} className="h-1" />
                </div>
              ))}
            </div>
          )}

          {/* Rejected Files */}
          {rejectedFiles.length > 0 && (
            <div className="p-3 border border-red-200 bg-red-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Some files were rejected:
                  </h4>
                  {rejectedFiles.map(({ file, errors }, index) => (
                    <div key={index} className="text-xs text-red-700">
                      {file.name}: {errors.map(e => e.message).join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary" />
              Encryption Password Required
            </DialogTitle>
            <DialogDescription>
              Enter a password to encrypt your files before upload. This ensures your data remains secure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dialog-auto-generate"
                checked={autoGenerate}
                onCheckedChange={setAutoGenerate}
              />
              <Label htmlFor="dialog-auto-generate" className="text-sm">
                Auto-generate secure password (recommended)
              </Label>
            </div>

            {!autoGenerate && (
              <div className="space-y-2">
                <Label htmlFor="dialog-password">Password</Label>
                <div className="relative">
                  <Input
                    id="dialog-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter encryption password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
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
                  </div>
                )}
              </div>
            )}

            <div className="bg-amber-50 p-3 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <strong>Important:</strong> {autoGenerate 
                    ? 'The generated password will be shown once. Make sure to save it securely.'
                    : 'Store this password safely. If lost, your encrypted files cannot be recovered.'
                  }
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (autoGenerate) {
                    const newPassword = EnhancedCryptoService.generateSecurePassword(24)
                    setPassword(newPassword)
                    
                    // Show the generated password to user
                    toast.success(`Generated password: ${newPassword}`, {
                      duration: 10000,
                      description: 'Save this password securely!'
                    })
                  }
                  
                  handlePasswordDialogConfirm()
                }}
                disabled={!autoGenerate && (!password || !passwordStrength?.isStrong)}
                className="flex-1"
              >
                {autoGenerate ? 'Generate & Continue' : 'Continue'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

