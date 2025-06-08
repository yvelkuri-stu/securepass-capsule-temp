// 📁 src/app/dashboard/settings/page.tsx (Fixed date handling)
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Shield, 
  Share2, 
  Camera, 
  Key, 
  Smartphone, 
  Mail, 
  Clock,
  AlertTriangle,
  CheckCircle,
  QrCode,
  Download
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || ''
  })
  const [securitySettings, setSecuritySettings] = useState({
    mfaEnabled: user?.mfaEnabled || false,
    biometricEnabled: true,
    emailNotifications: true,
    loginAlerts: true
  })

  const handleProfileUpdate = () => {
    updateUser({ displayName: profileData.displayName })
    toast.success('Profile updated successfully')
  }

  const handleMFAToggle = () => {
    setSecuritySettings(prev => ({ ...prev, mfaEnabled: !prev.mfaEnabled }))
    updateUser({ mfaEnabled: !securitySettings.mfaEnabled })
    toast.success(securitySettings.mfaEnabled ? 'MFA disabled' : 'MFA enabled')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  // Safe date formatting
  const formatUserDate = (date: Date | undefined) => {
    if (!date) return 'Not available'
    try {
      // Ensure it's a proper Date object
      const dateObj = new Date(date)
      if (isNaN(dateObj.getTime())) return 'Invalid date'
      return formatDate(dateObj)
    } catch (error) {
      return 'Date error'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, security, and sharing preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security & MFA</TabsTrigger>
          <TabsTrigger value="sharing">Sharing & Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback className="bg-gradient-main text-white text-lg">
                    {user?.displayName ? getInitials(user.displayName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed for security reasons
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Member since:</span>
                  <p className="font-medium">{formatUserDate(user?.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last login:</span>
                  <p className="font-medium">{formatUserDate(user?.lastLoginAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Security Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Score
              </CardTitle>
              <CardDescription>
                Your overall account security rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{user?.securityScore || 85}%</span>
                  <Badge variant="success">Excellent</Badge>
                </div>
                <Progress value={user?.securityScore || 85} className="h-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Strong password</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Email verified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {securitySettings.mfaEnabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm">Two-factor authentication</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Biometric authentication</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password & Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Password & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Change Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Update your account password
                  </p>
                </div>
                <Button variant="outline">Change</Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.mfaEnabled}
                  onCheckedChange={handleMFAToggle}
                />
              </div>

              {securitySettings.mfaEnabled && (
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Authenticator App</span>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">Email Backup</span>
                    </div>
                    <Button variant="outline" size="sm">Setup</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Login Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { location: 'Menifee, CA', device: 'Chrome on Windows', time: '2 hours ago', current: true },
                  { location: 'Menifee, CA', device: 'Mobile App', time: '1 day ago', current: false },
                  { location: 'Menifee, CA', device: 'Firefox on Windows', time: '3 days ago', current: false }
                ].map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{login.location}</span>
                        {login.current && <Badge variant="success" className="text-xs">Current</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{login.device}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{login.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sharing" className="space-y-6">
          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Privacy & Sharing
              </CardTitle>
              <CardDescription>
                Control how your data is shared and accessed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about capsule access and sharing
                  </p>
                </div>
                <Switch
                  checked={securitySettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSecuritySettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Login Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new device logins
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginAlerts}
                  onCheckedChange={(checked) => 
                    setSecuritySettings(prev => ({ ...prev, loginAlerts: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Access */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Access Protocol</CardTitle>
              <CardDescription>
                Configure what happens if you become inactive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">Inactivity Detection</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      If you don't access your account for 72 hours, emergency contacts will be notified 
                      and can request access to your shared capsules after a 24-hour grace period.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inactivity Threshold</Label>
                  <Input value="72 hours" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Grace Period</Label>
                  <Input value="24 hours" disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle>Data Portability</CardTitle>
              <CardDescription>
                Export your data or delete your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download all your capsules and data
                  </p>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-red-600">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}