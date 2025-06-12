// 📁 src/components/sharing/capsule-sharing.tsx (NEW - Advanced Sharing)
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar } from '@/components/ui/calendar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Share2, 
  Users, 
  Clock, 
  Eye, 
  Download, 
  Edit,
  Trash2,
  AlertTriangle,
  Shield,
  Link,
  Copy,
  QrCode,
  Calendar as CalendarIcon,
  Plus,
  Mail,
  UserCheck,
  UserX,
  History
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface SharedContact {
  id: string
  email: string
  name?: string
  permissions: Permission[]
  sharedAt: Date
  accessedAt?: Date
  expiresAt?: Date
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
}

interface EmergencyContact {
  id: string
  email: string
  name: string
  relationship: string
  activationDelay: number // hours
  conditions: EmergencyCondition[]
  notificationSent?: Date
  activated?: Date
}

type Permission = 'view' | 'download' | 'comment' | 'share'
type EmergencyCondition = 'inactivity' | 'manual' | 'scheduled'

interface CapsuleSharingProps {
  capsuleId: string
  capsuleTitle: string
  isShared: boolean
  sharedContacts: SharedContact[]
  emergencyContacts: EmergencyContact[]
  onUpdateSharing: (updates: any) => void
}

export function CapsuleSharing({
  capsuleId,
  capsuleTitle,
  isShared,
  sharedContacts: initialSharedContacts,
  emergencyContacts: initialEmergencyContacts,
  onUpdateSharing
}: CapsuleSharingProps) {
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>(initialSharedContacts)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(initialEmergencyContacts)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermissions, setSharePermissions] = useState<Permission[]>(['view'])
  const [shareExpiry, setShareExpiry] = useState<Date | undefined>()
  const [shareMessage, setShareMessage] = useState('')
  const [emergencyEmail, setEmergencyEmail] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyRelationship, setEmergencyRelationship] = useState('')
  const [emergencyDelay, setEmergencyDelay] = useState(72)
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false)
  const [publicLink, setPublicLink] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Generate public link when enabled
  useEffect(() => {
    if (publicLinkEnabled && !publicLink) {
      const link = `${window.location.origin}/shared/${capsuleId}?token=${generateShareToken()}`
      setPublicLink(link)
    }
  }, [publicLinkEnabled, capsuleId])

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  const addSharedContact = async () => {
    if (!shareEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    if (sharedContacts.some(contact => contact.email === shareEmail)) {
      toast.error('This email is already shared with')
      return
    }

    setIsLoading(true)
    
    try {
      const newContact: SharedContact = {
        id: Date.now().toString(),
        email: shareEmail,
        permissions: sharePermissions,
        sharedAt: new Date(),
        expiresAt: shareExpiry,
        status: 'pending'
      }

      const updatedContacts = [...sharedContacts, newContact]
      setSharedContacts(updatedContacts)
      
      // Send share notification (mock)
      await sendShareNotification(newContact, shareMessage)
      
      // Reset form
      setShareEmail('')
      setSharePermissions(['view'])
      setShareExpiry(undefined)
      setShareMessage('')
      
      // Update parent component
      onUpdateSharing({
        isShared: true,
        sharedWith: updatedContacts
      })
      
      toast.success(`Capsule shared with ${shareEmail}`)
    } catch (error) {
      toast.error('Failed to share capsule')
    } finally {
      setIsLoading(false)
    }
  }

  const removeSharedContact = async (contactId: string) => {
    const contact = sharedContacts.find(c => c.id === contactId)
    if (!contact) return

    const confirmed = confirm(`Remove sharing access for ${contact.email}?`)
    if (!confirmed) return

    const updatedContacts = sharedContacts.filter(c => c.id !== contactId)
    setSharedContacts(updatedContacts)
    
    onUpdateSharing({
      isShared: updatedContacts.length > 0,
      sharedWith: updatedContacts
    })
    
    toast.success(`Removed access for ${contact.email}`)
  }

  const updateContactPermissions = async (contactId: string, permissions: Permission[]) => {
    const updatedContacts = sharedContacts.map(contact =>
      contact.id === contactId ? { ...contact, permissions } : contact
    )
    setSharedContacts(updatedContacts)
    
    onUpdateSharing({
      isShared: true,
      sharedWith: updatedContacts
    })
    
    toast.success('Permissions updated')
  }

  const addEmergencyContact = async () => {
    if (!emergencyEmail.trim() || !emergencyName.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (emergencyContacts.some(contact => contact.email === emergencyEmail)) {
      toast.error('This email is already added as an emergency contact')
      return
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      email: emergencyEmail,
      name: emergencyName,
      relationship: emergencyRelationship || 'Emergency Contact',
      activationDelay: emergencyDelay,
      conditions: ['inactivity']
    }

    const updatedContacts = [...emergencyContacts, newContact]
    setEmergencyContacts(updatedContacts)
    
    // Reset form
    setEmergencyEmail('')
    setEmergencyName('')
    setEmergencyRelationship('')
    setEmergencyDelay(72)
    
    onUpdateSharing({
      emergencyContacts: updatedContacts
    })
    
    toast.success(`Added ${emergencyName} as emergency contact`)
  }

  const removeEmergencyContact = async (contactId: string) => {
    const contact = emergencyContacts.find(c => c.id === contactId)
    if (!contact) return

    const confirmed = confirm(`Remove ${contact.name} as emergency contact?`)
    if (!confirmed) return

    const updatedContacts = emergencyContacts.filter(c => c.id !== contactId)
    setEmergencyContacts(updatedContacts)
    
    onUpdateSharing({
      emergencyContacts: updatedContacts
    })
    
    toast.success(`Removed ${contact.name} from emergency contacts`)
  }

  const sendShareNotification = async (contact: SharedContact, message: string) => {
    // Mock email sending
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Share notification sent to:', contact.email)
  }

  const copyPublicLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink)
      toast.success('Link copied to clipboard!')
    }
  }

  const getPermissionIcon = (permission: Permission) => {
    switch (permission) {
      case 'view': return <Eye className="h-3 w-3" />
      case 'download': return <Download className="h-3 w-3" />
      case 'comment': return <Edit className="h-3 w-3" />
      case 'share': return <Share2 className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-500'
      case 'pending': return 'text-yellow-500'
      case 'expired': return 'text-red-500'
      case 'revoked': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <UserCheck className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'revoked': return <UserX className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Share with Specific People */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Share with People
          </CardTitle>
          <CardDescription>
            Give specific people access to this capsule with custom permissions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add New Contact Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="share-email">Email Address</Label>
              <Input
                id="share-email"
                type="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex flex-wrap gap-2">
                {(['view', 'download', 'comment', 'share'] as Permission[]).map((permission) => (
                  <Button
                    key={permission}
                    variant={sharePermissions.includes(permission) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSharePermissions(prev =>
                        prev.includes(permission)
                          ? prev.filter(p => p !== permission)
                          : [...prev, permission]
                      )
                    }}
                  >
                    {getPermissionIcon(permission)}
                    <span className="ml-1 capitalize">{permission}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {shareExpiry ? format(shareExpiry, "PPP") : "No expiry"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={shareExpiry}
                    onSelect={setShareExpiry}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-message">Message (Optional)</Label>
              <Textarea
                id="share-message"
                placeholder="Add a personal message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                className="min-h-[60px]"
              />
            </div>

            <div className="md:col-span-2">
              <Button 
                onClick={addSharedContact} 
                disabled={isLoading || !shareEmail.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Capsule
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Shared Contacts */}
          {sharedContacts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Shared With ({sharedContacts.length})</h4>
              {sharedContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  layout
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {contact.name ? contact.name[0].toUpperCase() : contact.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{contact.name || contact.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Shared {format(contact.sharedAt, "MMM d, yyyy")}
                        {contact.expiresAt && ` • Expires ${format(contact.expiresAt, "MMM d, yyyy")}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusIcon(contact.status)}
                    
                    <div className="flex space-x-1">
                      {contact.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {getPermissionIcon(permission)}
                          <span className="ml-1">{permission}</span>
                        </Badge>
                      ))}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Invitation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => removeSharedContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Public Link Sharing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Public Link Sharing
          </CardTitle>
          <CardDescription>
            Create a shareable link that anyone can use to access this capsule
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public-link">Enable Public Link</Label>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this capsule
              </p>
            </div>
            <Switch
              id="public-link"
              checked={publicLinkEnabled}
              onCheckedChange={setPublicLinkEnabled}
            />
          </div>

          {publicLinkEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 border-t pt-4"
            >
              <div className="flex items-center space-x-2">
                <Input value={publicLink} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={copyPublicLink}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setShowQRCode(true)}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Link created {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <Button variant="ghost" size="sm">
                  <History className="h-4 w-4 mr-1" />
                  View Access Log
                </Button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <strong>Security Warning:</strong> Anyone with this link can access your capsule. 
                    Only share with trusted individuals.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-red-500" />
            Emergency Access
          </CardTitle>
          <CardDescription>
            Set up trusted contacts who can access this capsule in case of emergency
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Emergency Contact Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-red-50/50">
            <div className="space-y-2">
              <Label htmlFor="emergency-email">Contact Email *</Label>
              <Input
                id="emergency-email"
                type="email"
                placeholder="trusted.person@example.com"
                value={emergencyEmail}
                onChange={(e) => setEmergencyEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-name">Full Name *</Label>
              <Input
                id="emergency-name"
                placeholder="John Doe"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-relationship">Relationship</Label>
              <Select value={emergencyRelationship} onValueChange={setEmergencyRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">Family Member</SelectItem>
                  <SelectItem value="spouse">Spouse/Partner</SelectItem>
                  <SelectItem value="friend">Trusted Friend</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="executor">Estate Executor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency-delay">Activation Delay (Hours)</Label>
              <Select 
                value={emergencyDelay.toString()} 
                onValueChange={(value) => setEmergencyDelay(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="72">72 hours (recommended)</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                  <SelectItem value="720">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button 
                onClick={addEmergencyContact}
                disabled={!emergencyEmail.trim() || !emergencyName.trim()}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Emergency Contact
              </Button>
            </div>
          </div>

          {/* Emergency Contacts List */}
          {emergencyContacts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Emergency Contacts ({emergencyContacts.length})</h4>
              {emergencyContacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  layout
                  className="flex items-center justify-between p-3 border rounded-lg bg-red-50/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {contact.email} • {contact.relationship}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Activates after {contact.activationDelay} hours of inactivity
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {contact.activated ? (
                      <Badge variant="destructive">Activated</Badge>
                    ) : contact.notificationSent ? (
                      <Badge variant="outline">Notified</Badge>
                    ) : (
                      <Badge variant="secondary">Standby</Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmergencyContact(contact.id)}
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Emergency Protocol Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">How Emergency Access Works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Emergency contacts are notified if you're inactive for the specified period</li>
              <li>• They receive access only after the activation delay expires</li>
              <li>• You'll receive notifications before emergency access is granted</li>
              <li>• You can cancel emergency access activation at any time</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code for Quick Sharing</DialogTitle>
            <DialogDescription>
              Scan this QR code to quickly access the capsule
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center p-6">
            <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
              <span className="text-xs text-muted-foreground ml-2">QR Code</span>
            </div>
          </div>
          
          <div className="text-center">
            <Button onClick={copyPublicLink} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copy Link Instead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}