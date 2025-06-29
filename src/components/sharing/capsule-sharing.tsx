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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu'
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
  History,
  MoreVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

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
  activationDelay: number
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
  isShared: initialIsShared,
  sharedContacts: initialSharedContacts,
  emergencyContacts: initialEmergencyContacts,
  onUpdateSharing
}: CapsuleSharingProps) {
  // State
  const [isShared, setIsShared] = useState(initialIsShared)
  const [sharedContacts, setSharedContacts] = useState<SharedContact[]>(initialSharedContacts)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(initialEmergencyContacts)
  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false)
  const [shareToken, setShareToken] = useState('')
  
  // Form states
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(['view'])
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [shareMessage, setShareMessage] = useState('')
  
  // Emergency contact form
  const [newEmergencyEmail, setNewEmergencyEmail] = useState('')
  const [newEmergencyName, setNewEmergencyName] = useState('')
  const [newEmergencyRelationship, setNewEmergencyRelationship] = useState('')
  const [newEmergencyDelay, setNewEmergencyDelay] = useState(72)
  
  // UI states
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddEmergency, setShowAddEmergency] = useState(false)
  const [showShareHistory, setShowShareHistory] = useState(false)

  // Generate public link when enabled
  useEffect(() => {
    if (publicLinkEnabled && !shareToken) {
      setShareToken(generateShareToken())
    }
  }, [publicLinkEnabled, shareToken])

  // Helper function to log activity
  const logSharingActivity = async (action: string, description: string, metadata: any = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('activity_log').insert({
        user_id: user.id,
        capsule_id: capsuleId,
        action,
        description,
        metadata: {
          ...metadata,
          capsule_title: capsuleTitle
        }
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw error for logging failures
    }
  }

  const generateShareToken = () => {
    return Math.random().toString(36).substr(2, 16) + Date.now().toString(36)
  }

  const addSharedContact = async () => {
    if (!newContactEmail) {
      toast.error('Email is required')
      return
    }

    if (!newContactEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      const newContact: SharedContact = {
        id: Math.random().toString(36).substr(2, 9),
        email: newContactEmail.toLowerCase().trim(),
        name: newContactName || undefined,
        permissions: selectedPermissions,
        sharedAt: new Date(),
        expiresAt: expirationDate,
        status: 'pending'
      }

      const updatedContacts = [...sharedContacts, newContact]
      setSharedContacts(updatedContacts)

      // Update parent component
      onUpdateSharing({
        isShared: true,
        sharedContacts: updatedContacts
      })

      // Log activity
      await logSharingActivity(
        'shared_capsule',
        `Shared capsule "${capsuleTitle}" with ${newContactEmail}`,
        {
          shared_with: newContactEmail,
          permissions: selectedPermissions,
          expires_at: expirationDate?.toISOString()
        }
      )

      // Send notification
      await sendShareNotification(newContact, shareMessage)

      // Reset form
      setNewContactEmail('')
      setNewContactName('')
      setSelectedPermissions(['view'])
      setExpirationDate(undefined)
      setShareMessage('')
      setShowAddContact(false)

      toast.success(`Capsule shared with ${newContactEmail}`)

    } catch (error: any) {
      console.error('Failed to add shared contact:', error)
      toast.error('Failed to share capsule')
    }
  }

  const removeSharedContact = async (contactId: string) => {
    try {
      const contact = sharedContacts.find(c => c.id === contactId)
      if (!contact) return

      const updatedContacts = sharedContacts.filter(c => c.id !== contactId)
      setSharedContacts(updatedContacts)

      // Update parent component
      onUpdateSharing({
        isShared: updatedContacts.length > 0,
        sharedContacts: updatedContacts
      })

      // Log activity
      await logSharingActivity(
        'unshared_capsule',
        `Removed sharing access for ${contact.email}`,
        {
          removed_contact: contact.email
        }
      )

      toast.success(`Removed access for ${contact.email}`)

    } catch (error: any) {
      console.error('Failed to remove shared contact:', error)
      toast.error('Failed to remove access')
    }
  }

  const updateContactPermissions = async (contactId: string, permissions: Permission[]) => {
    try {
      const updatedContacts = sharedContacts.map(contact =>
        contact.id === contactId ? { ...contact, permissions } : contact
      )
      setSharedContacts(updatedContacts)

      // Update parent component
      onUpdateSharing({
        sharedContacts: updatedContacts
      })

      const contact = updatedContacts.find(c => c.id === contactId)
      if (contact) {
        // Log activity
        await logSharingActivity(
          'updated_permissions',
          `Updated permissions for ${contact.email}`,
          {
            contact_email: contact.email,
            new_permissions: permissions
          }
        )

        toast.success(`Updated permissions for ${contact.email}`)
      }

    } catch (error: any) {
      console.error('Failed to update permissions:', error)
      toast.error('Failed to update permissions')
    }
  }

  const addEmergencyContact = async () => {
    if (!newEmergencyEmail || !newEmergencyName || !newEmergencyRelationship) {
      toast.error('All fields are required')
      return
    }

    try {
      const newContact: EmergencyContact = {
        id: Math.random().toString(36).substr(2, 9),
        email: newEmergencyEmail.toLowerCase().trim(),
        name: newEmergencyName,
        relationship: newEmergencyRelationship,
        activationDelay: newEmergencyDelay,
        conditions: ['inactivity']
      }

      const updatedContacts = [...emergencyContacts, newContact]
      setEmergencyContacts(updatedContacts)

      // Update parent component
      onUpdateSharing({
        emergencyContacts: updatedContacts
      })

      // Log activity
      await logSharingActivity(
        'added_emergency_contact',
        `Added emergency contact: ${newEmergencyName} (${newEmergencyEmail})`,
        {
          emergency_contact: newEmergencyEmail,
          relationship: newEmergencyRelationship,
          activation_delay: newEmergencyDelay
        }
      )

      // Reset form
      setNewEmergencyEmail('')
      setNewEmergencyName('')
      setNewEmergencyRelationship('')
      setNewEmergencyDelay(72)
      setShowAddEmergency(false)

      toast.success(`Emergency contact added: ${newEmergencyName}`)

    } catch (error: any) {
      console.error('Failed to add emergency contact:', error)
      toast.error('Failed to add emergency contact')
    }
  }

  const removeEmergencyContact = async (contactId: string) => {
    try {
      const contact = emergencyContacts.find(c => c.id === contactId)
      if (!contact) return

      const updatedContacts = emergencyContacts.filter(c => c.id !== contactId)
      setEmergencyContacts(updatedContacts)

      // Update parent component
      onUpdateSharing({
        emergencyContacts: updatedContacts
      })

      // Log activity
      await logSharingActivity(
        'removed_emergency_contact',
        `Removed emergency contact: ${contact.name}`,
        {
          removed_contact: contact.email
        }
      )

      toast.success(`Removed emergency contact: ${contact.name}`)

    } catch (error: any) {
      console.error('Failed to remove emergency contact:', error)
      toast.error('Failed to remove emergency contact')
    }
  }

  const sendShareNotification = async (contact: SharedContact, message: string) => {
    try {
      // Mock email sending - in real app, this would call your email service
      console.log('Sending share notification:', {
        to: contact.email,
        subject: `${capsuleTitle} has been shared with you`,
        message: message || `You have been granted access to the capsule "${capsuleTitle}".`
      })

      // In a real implementation, you would:
      // 1. Call your email service API
      // 2. Send push notification
      // 3. Create in-app notification

      toast.success(`Notification sent to ${contact.email}`)

    } catch (error: any) {
      console.error('Failed to send notification:', error)
      toast.error('Failed to send notification')
    }
  }

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/shared/${shareToken}`
    navigator.clipboard.writeText(publicUrl)
    toast.success('Public link copied to clipboard')
  }

  const getPermissionIcon = (permission: Permission) => {
    switch (permission) {
      case 'view': return <Eye className="h-4 w-4" />
      case 'download': return <Download className="h-4 w-4" />
      case 'comment': return <Edit className="h-4 w-4" />
      case 'share': return <Share2 className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'revoked': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <UserCheck className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      case 'revoked': return <UserX className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Sharing Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Capsule Sharing
              </CardTitle>
              <CardDescription>
                Control who can access this capsule and what they can do
              </CardDescription>
            </div>
            <Switch
              checked={isShared}
              onCheckedChange={(checked) => {
                setIsShared(checked)
                onUpdateSharing({ isShared: checked })
              }}
            />
          </div>
        </CardHeader>

        {isShared && (
          <CardContent className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddContact(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPublicLinkEnabled(!publicLinkEnabled)}
              >
                <Link className="h-4 w-4 mr-2" />
                {publicLinkEnabled ? 'Disable' : 'Enable'} Public Link
              </Button>
            </div>

            {/* Public Link */}
            {publicLinkEnabled && (
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Public Link</h4>
                      <p className="text-sm text-muted-foreground">
                        Anyone with this link can view the capsule
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyPublicLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shared Contacts */}
            {sharedContacts.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Shared With</h4>
                {sharedContacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {contact.name?.[0] || contact.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contact.name || contact.email}</p>
                            {contact.name && (
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Permissions */}
                          <div className="flex gap-1">
                            {contact.permissions.map((permission) => (
                              <Badge key={permission} variant="secondary" className="text-xs">
                                {getPermissionIcon(permission)}
                                <span className="ml-1 capitalize">{permission}</span>
                              </Badge>
                            ))}
                          </div>

                          {/* Status */}
                          <Badge className={getStatusColor(contact.status)}>
                            {getStatusIcon(contact.status)}
                            <span className="ml-1 capitalize">{contact.status}</span>
                          </Badge>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  // Handle permission editing
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Permissions
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => sendShareNotification(contact, '')}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => removeSharedContact(contact.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Access
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Emergency Access
              </CardTitle>
              <CardDescription>
                Configure trusted contacts for emergency access to your capsules
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEmergency(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Emergency Contact
            </Button>
          </div>
        </CardHeader>

        {emergencyContacts.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {contact.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {contact.email} • {contact.relationship}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {contact.activationDelay}h delay
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmergencyContact(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Capsule</DialogTitle>
            <DialogDescription>
              Add someone to share this capsule with and configure their permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="flex gap-2 mt-2">
                {(['view', 'download', 'comment', 'share'] as Permission[]).map((permission) => (
                  <Button
                    key={permission}
                    variant={selectedPermissions.includes(permission) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (selectedPermissions.includes(permission)) {
                        setSelectedPermissions(prev => prev.filter(p => p !== permission))
                      } else {
                        setSelectedPermissions(prev => [...prev, permission])
                      }
                    }}
                  >
                    {getPermissionIcon(permission)}
                    <span className="ml-1 capitalize">{permission}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Add a personal message..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
              <Button onClick={addSharedContact}>
                Share Capsule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Emergency Contact Dialog */}
      <Dialog open={showAddEmergency} onOpenChange={setShowAddEmergency}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add a trusted contact who can access your capsule in emergency situations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergency-email">Email Address *</Label>
                <Input
                  id="emergency-email"
                  type="email"
                  value={newEmergencyEmail}
                  onChange={(e) => setNewEmergencyEmail(e.target.value)}
                  placeholder="emergency@example.com"
                />
              </div>
              <div>
                <Label htmlFor="emergency-name">Full Name *</Label>
                <Input
                  id="emergency-name"
                  value={newEmergencyName}
                  onChange={(e) => setNewEmergencyName(e.target.value)}
                  placeholder="Emergency Contact Name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="relationship">Relationship *</Label>
              <Select value={newEmergencyRelationship} onValueChange={setNewEmergencyRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="lawyer">Lawyer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delay">Activation Delay (hours)</Label>
              <Input
                id="delay"
                type="number"
                value={newEmergencyDelay}
                onChange={(e) => setNewEmergencyDelay(parseInt(e.target.value) || 72)}
                min="1"
                max="8760"
              />
              <p className="text-sm text-muted-foreground mt-1">
                How long to wait before granting emergency access
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddEmergency(false)}>
                Cancel
              </Button>
              <Button onClick={addEmergencyContact}>
                Add Emergency Contact
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}