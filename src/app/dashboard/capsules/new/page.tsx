// 📁 src/app/dashboard/capsules/new/page.tsx (ENHANCED VERSION)
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft,
  FileText,
  Image,
  Video,
  Paperclip,
  QrCode,
  Mic,
  Shield,
  Users,
  Clock,
  Save,
  Lock,
  Upload,
  X,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { SecureCapsuleService } from '@/lib/secure-capsules'
import { EnhancedCryptoService } from '@/lib/enhanced-crypto'
import { useAuth } from '@/hooks/useAuth'
import { DataType, SecurityLevel } from '@/types'
import { toast } from 'sonner'

const dataTypes: { id: DataType; label: string; icon: any; description: string }[] = [
  { id: 'text', label: 'Text Content', icon: FileText, description: 'Secure notes and text documents' },
  { id: 'images', label: 'Images', icon: Image, description: 'Photos and image files' },
  { id: 'videos', label: 'Videos', icon: Video, description: 'Video files and recordings' },
  { id: 'attachments', label: 'File Attachments', icon: Paperclip, description: 'Documents and other files' },
  { id: 'qrCodes', label: 'QR Codes', icon: QrCode, description: 'QR code data and links' },
  { id: 'voiceNotes', label: 'Voice Notes', icon: Mic, description: 'Audio recordings and notes' }
]

const securityLevels: { id: SecurityLevel; label: string; description: string; color: string }[] = [
  { id: 'low', label: 'Low', description: 'Basic security', color: 'bg-green-500' },
  { id: 'medium', label: 'Medium', description: 'Standard encryption + access logging', color: 'bg-yellow-500' },
  { id: 'high', label: 'High', description: 'Strong encryption + password protection', color: 'bg-orange-500' },
  { id: 'maximum', label: 'Maximum', description: 'Military-grade encryption + auto-destruct', color: 'bg-red-500' }
]

interface UploadedFile {
  file: File
  preview?: string
  id: string
}

export default function EnhancedNewCapsulePage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedDataTypes: [] as DataType[],
    securityLevel: 'medium' as SecurityLevel,
    tags: '',
    emergencyContacts: '',
    textContent: '',
    enablePasswordProtection: false,
    capsulePassword: '',
    confirmPassword: ''
  })
  
  // File uploads
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  
  // Security
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = formData.capsulePassword ? 
    EnhancedCryptoService.checkPasswordStrength(formData.capsulePassword) : null

  // File upload handling
  const onDrop = (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file, index) => {
      const id = `${Date.now()}-${index}`
      const uploadedFile: UploadedFile = { file, id }
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedFiles(prev => 
            prev.map(f => f.id === id ? { ...f, preview: e.target?.result as string } : f)
          )
        }
        reader.readAsDataURL(file)
      }
      
      return uploadedFile
    })
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Auto-select file types based on uploads
    const newDataTypes = new Set(formData.selectedDataTypes)
    acceptedFiles.forEach(file => {
      if (file.type.startsWith('image/')) newDataTypes.add('images')
      else if (file.type.startsWith('video/')) newDataTypes.add('videos')
      else newDataTypes.add('attachments')
    })
    
    setFormData(prev => ({ 
      ...prev, 
      selectedDataTypes: Array.from(newDataTypes)
    }))
    
    toast.success(`Added ${acceptedFiles.length} file(s)`)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleDataTypeToggle = (dataType: DataType) => {
    setFormData(prev => ({
      ...prev,
      selectedDataTypes: prev.selectedDataTypes.includes(dataType)
        ? prev.selectedDataTypes.filter(t => t !== dataType)
        : [...prev.selectedDataTypes, dataType]
    }))
  }

  const generateSecurePassword = () => {
    const newPassword = EnhancedCryptoService.generateSecurePassword(20)
    setFormData(prev => ({ 
      ...prev, 
      capsulePassword: newPassword,
      confirmPassword: newPassword
    }))
    toast.success('Secure password generated!')
  }

  const handleSubmit = async () => {
    console.log('🚀 Starting capsule creation...')
    
    if (!formData.title.trim()) {
      toast.error('Please enter a capsule title')
      return
    }

    if (formData.selectedDataTypes.length === 0 && uploadedFiles.length === 0 && !formData.textContent.trim()) {
      toast.error('Please add some content, files, or select data types')
      return
    }

    if (formData.enablePasswordProtection) {
      if (!formData.capsulePassword) {
        toast.error('Please enter a password for protection')
        return
      }
      if (formData.capsulePassword !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (!passwordStrength?.isStrong) {
        toast.error('Please use a stronger password')
        return
      }
    }

    setIsSubmitting(true)

    try {
      console.log('📝 Preparing capsule data...')
      
      // Prepare capsule content
      const content: any = {}
      
      // Add text content if provided
      if (formData.textContent.trim()) {
        content.text = formData.textContent.trim()
        if (!formData.selectedDataTypes.includes('text')) {
          formData.selectedDataTypes.push('text')
        }
      }
      
      // Add file references (actual files will be uploaded separately)
      if (uploadedFiles.length > 0) {
        content.files = uploadedFiles.map(f => ({
          name: f.file.name,
          size: f.file.size,
          type: f.file.type,
          id: f.id
        }))
      }

      // Prepare capsule data
      const capsuleData = {
        userId: user!.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dataTypes: formData.selectedDataTypes,
        content,
        metadata: {
          itemCount: (formData.textContent ? 1 : 0) + uploadedFiles.length,
          totalSize: uploadedFiles.reduce((sum, f) => sum + f.file.size, 0),
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          category: 'Personal',
          aiTags: [],
          securityLevel: formData.securityLevel,
          version: 1
        },
        sharing: {
          isShared: false,
          sharedWith: [],
          emergencyContacts: formData.emergencyContacts.split(',').map(email => ({
            email: email.trim(),
            name: email.trim(),
            relationship: 'Emergency Contact',
            activationDelay: 72,
            conditions: ['inactivity' as const]
          })).filter(contact => contact.email),
          publicAccess: false
        },
        security: {
          encryptionEnabled: formData.enablePasswordProtection,
          passwordProtected: formData.enablePasswordProtection,
          biometricLock: formData.securityLevel === 'high' || formData.securityLevel === 'maximum',
          accessLogging: formData.securityLevel !== 'low',
          autoDestruct: formData.securityLevel === 'maximum' ? {
            enabled: true,
            maxAccess: 100,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            currentAccess: 0
          } : undefined
        },
        lastAccessedAt: new Date()
      }

      console.log('💾 Saving capsule to database...')
      
      // Create the capsule with optional encryption
      const createdCapsule = await SecureCapsuleService.saveCapsule(
        capsuleData, 
        formData.enablePasswordProtection ? formData.capsulePassword : undefined
      )

      console.log('✅ Capsule created successfully:', createdCapsule.id)
      
      // TODO: Upload files to storage service here
      if (uploadedFiles.length > 0) {
        console.log(`📁 Would upload ${uploadedFiles.length} files to storage...`)
        // For now, just log the files that would be uploaded
        uploadedFiles.forEach(f => {
          console.log(`- ${f.file.name} (${f.file.size} bytes)`)
        })
      }

      toast.success(`Capsule "${formData.title}" created successfully!`)
      
      // Navigate to the new capsule
      router.push(`/dashboard/capsules/${createdCapsule.id}`)
      
    } catch (error: any) {
      console.error('❌ Capsule creation failed:', error)
      toast.error(`Failed to create capsule: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Title and description' },
    { id: 2, title: 'Content & Files', description: 'Add your data' },
    { id: 3, title: 'Data Types', description: 'What will you store?' },
    { id: 4, title: 'Security Settings', description: 'Protection level' }
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Capsule</h1>
          <p className="text-muted-foreground">Secure your important data in a new capsule</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepItem.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepItem.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className="text-sm font-medium">{stepItem.title}</div>
                  <div className="text-xs text-muted-foreground">{stepItem.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    step > stepItem.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Give your capsule a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Capsule Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Personal Documents, Family Photos"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this capsule will contain..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="personal, documents, important (separated by commas)"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Text Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Text Content
                </CardTitle>
                <CardDescription>
                  Add secure notes, passwords, or other text content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter your secure text content here..."
                  value={formData.textContent}
                  onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                  className="min-h-[150px] font-mono"
                />
                {formData.textContent && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {formData.textContent.length} characters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  File Upload
                </CardTitle>
                <CardDescription>
                  Upload images, documents, and other files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to select files
                  </p>
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Uploaded Files ({uploadedFiles.length})</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedFiles.map((fileItem) => (
                        <div key={fileItem.id} className="flex items-center space-x-2 p-2 border rounded">
                          {fileItem.preview ? (
                            <img src={fileItem.preview} alt="" className="w-8 h-8 object-cover rounded" />
                          ) : (
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(fileItem.id)}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Types</CardTitle>
              <CardDescription>Select what types of data you'll store in this capsule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.selectedDataTypes.includes(type.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleDataTypeToggle(type.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={formData.selectedDataTypes.includes(type.id)}
                        readOnly
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <type.icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <div className="space-y-6">
            {/* Security Level */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Level
                </CardTitle>
                <CardDescription>Choose the protection level for your capsule</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityLevels.map((level) => (
                    <div
                      key={level.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        formData.securityLevel === level.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, securityLevel: level.id }))}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-4 h-4 rounded-full mt-0.5 ${level.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{level.label} Security</span>
                            {formData.securityLevel === level.id && (
                              <Badge variant="default">Selected</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{level.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Password Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password Protection
                </CardTitle>
                <CardDescription>Add an extra layer of security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="password-protection">Enable Password Protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt capsule content with a password
                    </p>
                  </div>
                  <Switch
                    id="password-protection"
                    checked={formData.enablePasswordProtection}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, enablePasswordProtection: checked }))
                    }
                  />
                </div>

                {formData.enablePasswordProtection && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="capsule-password">Capsule Password</Label>
                      <div className="relative">
                        <Input
                          id="capsule-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter a strong password"
                          value={formData.capsulePassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, capsulePassword: e.target.value }))}
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
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      />
                      {formData.confirmPassword && formData.capsulePassword !== formData.confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Emergency Access
                </CardTitle>
                <CardDescription>Configure emergency access (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="emergency-contacts">Emergency Contacts</Label>
                  <Input
                    id="emergency-contacts"
                    placeholder="email1@example.com, email2@example.com"
                    value={formData.emergencyContacts}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContacts: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    These contacts can access your capsule after 72 hours of inactivity
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1 || isSubmitting}
        >
          Previous
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={
              (step === 1 && !formData.title.trim()) ||
              isSubmitting
            }
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Capsule
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}