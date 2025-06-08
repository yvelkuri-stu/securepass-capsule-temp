// 📁 src/app/dashboard/capsules/new/page.tsx (Fixed with correct icons)
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
  Save
} from 'lucide-react'
import { useCapsuleStore } from '@/store/capsules'
import { useAuth } from '@/hooks/useAuth'
import { DataType, SecurityLevel, Capsule } from '@/types'
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
  { id: 'low', label: 'Low', description: 'Basic encryption', color: 'bg-green-500' },
  { id: 'medium', label: 'Medium', description: 'Standard encryption + access logging', color: 'bg-yellow-500' },
  { id: 'high', label: 'High', description: 'Strong encryption + biometric lock', color: 'bg-orange-500' },
  { id: 'maximum', label: 'Maximum', description: 'Military-grade encryption + auto-destruct', color: 'bg-red-500' }
]

export default function NewCapsulePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createCapsule, isLoading } = useCapsuleStore()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selectedDataTypes: [] as DataType[],
    securityLevel: 'medium' as SecurityLevel,
    tags: '',
    emergencyContacts: ''
  })

  const handleDataTypeToggle = (dataType: DataType) => {
    setFormData(prev => ({
      ...prev,
      selectedDataTypes: prev.selectedDataTypes.includes(dataType)
        ? prev.selectedDataTypes.filter(t => t !== dataType)
        : [...prev.selectedDataTypes, dataType]
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a capsule title')
      return
    }

    if (formData.selectedDataTypes.length === 0) {
      toast.error('Please select at least one data type')
      return
    }

    try {
      const capsuleData: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: user!.id,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dataTypes: formData.selectedDataTypes,
        content: {},
        metadata: {
          itemCount: 0,
          totalSize: 0,
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
            conditions: ['inactivity']
          })).filter(contact => contact.email),
          publicAccess: false
        },
        security: {
          encryptionEnabled: true,
          passwordProtected: formData.securityLevel === 'high' || formData.securityLevel === 'maximum',
          biometricLock: formData.securityLevel === 'high' || formData.securityLevel === 'maximum',
          accessLogging: formData.securityLevel !== 'low',
          autoDestruct: formData.securityLevel === 'maximum' ? {
            enabled: true,
            maxAccess: 100,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            currentAccess: 0
          } : undefined
        },
        lastAccessedAt: new Date()
      }

      await createCapsule(capsuleData)
      toast.success('Capsule created successfully!')
      router.push('/dashboard/capsules')
    } catch (error) {
      toast.error('Failed to create capsule. Please try again.')
    }
  }

  const steps = [
    { id: 1, title: 'Basic Information', description: 'Title and description' },
    { id: 2, title: 'Data Types', description: 'What will you store?' },
    { id: 3, title: 'Security Settings', description: 'Protection level' },
    { id: 4, title: 'Sharing & Emergency', description: 'Access controls' }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                <p className="text-xs text-muted-foreground">
                  Use tags to organize and find your capsules easily
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
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
              {formData.selectedDataTypes.length > 0 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected data types:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedDataTypes.map((type) => {
                      const typeInfo = dataTypes.find(t => t.id === type)!
                      return (
                        <Badge key={type} variant="secondary">
                          <typeInfo.icon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
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
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Sharing & Emergency Access
              </CardTitle>
              <CardDescription>Configure emergency access and sharing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContacts">Emergency Contacts (Optional)</Label>
                <Input
                  id="emergencyContacts"
                  placeholder="email1@example.com, email2@example.com"
                  value={formData.emergencyContacts}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContacts: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  These contacts can access your capsule after 72 hours of inactivity
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Emergency Access Protocol</p>
                    <p className="text-xs text-muted-foreground">
                      If you don't access your account for 72 hours, emergency contacts will be notified 
                      and granted access to this capsule after a grace period.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        {step < 4 ? (
          <Button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={
              (step === 1 && !formData.title.trim()) ||
              (step === 2 && formData.selectedDataTypes.length === 0)
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
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