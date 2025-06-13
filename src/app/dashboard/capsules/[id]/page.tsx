// 📁 src/app/dashboard/capsules/[id]/page.tsx (UPDATED with sharing functionality)
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Trash2, 
  Shield, 
  Lock, 
  Unlock,
  Plus,
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react'
import { CapsulePasswordProtection } from '@/components/security/capsule-password-protection'
import { CapsuleUnlockGuard } from '@/components/capsules/capsule-unlock-guard'
import { CapsuleSharing } from '@/components/sharing/capsule-sharing'
import { SecureCapsuleService, SecureCapsule } from '@/lib/secure-capsules'
import { useCapsuleStore } from '@/store/capsules'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'

export default function SecureCapsuleViewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { deleteCapsule } = useCapsuleStore()
  
  const capsuleId = params.id as string
  const [capsule, setCapsule] = useState<SecureCapsule | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSharingOpen, setIsSharingOpen] = useState(false)
  const [fileStats, setFileStats] = useState({ count: 0, totalSize: 0 })

  useEffect(() => {
    const fetchCapsule = async () => {
      if (!capsuleId) return
      
      try {
        setIsLoading(true)
        
        // First, get basic capsule info (without decrypting)
        const capsules = await SecureCapsuleService.getUserCapsules()
        const foundCapsule = capsules.find(c => c.id === capsuleId)
        
        if (!foundCapsule) {
          throw new Error('Capsule not found')
        }
        
        setCapsule(foundCapsule)
        
      } catch (error: any) {
        console.error('Error loading capsule:', error)
        toast.error('Failed to load capsule')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCapsule()
  }, [capsuleId])

  const handlePasswordProtectionChange = async (isProtected: boolean, password?: string) => {
    if (!capsule) return
    
    try {
      if (isProtected && password) {
        await SecureCapsuleService.addPasswordProtection(capsule.id, password)
        toast.success('Password protection enabled!')
      } else {
        // This would need the current password in a real implementation
        toast.info('Password protection changes require current password')
      }
      
      // Refresh capsule data
      const updatedCapsules = await SecureCapsuleService.getUserCapsules()
      const updatedCapsule = updatedCapsules.find(c => c.id === capsuleId)
      if (updatedCapsule) {
        setCapsule(updatedCapsule)
      }
      
    } catch (error: any) {
      toast.error(`Failed to update password protection: ${error.message}`)
    }
  }

  const handleDelete = async () => {
    if (!capsule || isDeleting) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${capsule.title}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setIsDeleting(true)
    try {
      await deleteCapsule(capsule.id)
      router.push('/dashboard/capsules')
    } catch (error) {
      setIsDeleting(false)
    }
  }

  const handleUpdateSharing = (updates: any) => {
    if (!capsule) return;
    
    // In a real app, this would be a single API call to update the capsule's sharing settings.
    // For now, we'll just optimistically update the local state.
    setCapsule(prev => {
        if (!prev) return null;
        return {
            ...prev,
            sharing: {
                ...prev.sharing,
                ...updates
            }
        }
    })
    toast.success('Sharing settings updated!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!capsule) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Capsule not found</h2>
          <p className="text-muted-foreground mb-4">
            The capsule you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/dashboard/capsules">
            <Button>Back to Capsules</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CapsuleUnlockGuard 
      capsuleId={capsule.id} 
      isProtected={capsule.security.passwordProtected}
    >
      {(unlocked, currentPassword) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{capsule.title}</h1>
                  {capsule.security.passwordProtected && (
                    <Badge variant="default" className="ml-2">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                  {capsule.isEncrypted && (
                    <Badge variant="secondary" className="ml-2">
                      <Shield className="h-3 w-3 mr-1" />
                      Encrypted
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mt-1">
                  {capsule.description || 'No description provided'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setIsSharingOpen(true)}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Security Status Alert */}
          {!unlocked && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-700">
                    This capsule is locked. Some content and features are not available.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="content" disabled={!unlocked}>
                    Content {!unlocked && <Lock className="h-3 w-3 ml-1" />}
                  </TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Basic Info Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Capsule Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <p className="font-medium">{formatDate(capsule.createdAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Updated:</span>
                          <p className="font-medium">{formatDate(capsule.updatedAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <p className="font-medium">{capsule.metadata.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Security Level:</span>
                          <Badge variant="outline" className="text-xs">
                            {capsule.metadata.securityLevel}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <Link href={`/dashboard/capsules/${capsule.id}/files`}>
                          <Button variant="outline" className="w-full justify-start" disabled={!unlocked}>
                            <Shield className="h-4 w-4 mr-2" />
                            {unlocked ? 'Manage Files' : 'Unlock to Access Files'}
                          </Button>
                        </Link>
                        
                        <Button variant="outline" className="w-full justify-start" disabled={!unlocked} onClick={() => setIsSharingOpen(true)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          {unlocked ? 'Share Capsule' : 'Unlock to Share'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Capsule Content</CardTitle>
                      <CardDescription>
                        {unlocked ? 'Decrypted content from this capsule' : 'Content locked - password required'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {unlocked ? (
                        <div className="space-y-4">
                          {Object.keys(capsule.content).length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No content stored yet</p>
                              <Link href={`/dashboard/capsules/${capsule.id}/files`}>
                                <Button className="mt-2">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Content
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div>
                              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                                {JSON.stringify(capsule.content, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            Content is encrypted and locked. Enter the capsule password to view.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  {/* Password Protection */}
                  <CapsulePasswordProtection
                    capsuleId={capsule.id}
                    isProtected={capsule.security.passwordProtected}
                    onProtectionChange={handlePasswordProtectionChange}
                  />

                  {/* Security Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Status</CardTitle>
                      <CardDescription>Current security features for this capsule</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium">Content Encryption</p>
                              <p className="text-sm text-muted-foreground">
                                {capsule.isEncrypted ? 'AES-256 encrypted' : 'Not encrypted'}
                              </p>
                            </div>
                          </div>
                          {capsule.isEncrypted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Lock className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="font-medium">Password Protection</p>
                              <p className="text-sm text-muted-foreground">
                                {capsule.security.passwordProtected ? 'Password required' : 'No password'}
                              </p>
                            </div>
                          </div>
                          {capsule.security.passwordProtected ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Eye className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="font-medium">Access Logging</p>
                              <p className="text-sm text-muted-foreground">
                                {capsule.security.accessLogging ? 'All access logged' : 'No logging'}
                              </p>
                            </div>
                          </div>
                          {capsule.security.accessLogging ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Share2 className="h-5 w-5 text-teal-500" />
                            <div>
                              <p className="font-medium">Sharing Status</p>
                              <p className="text-sm text-muted-foreground">
                                {capsule.sharing.isShared ? `Shared with ${capsule.sharing.sharedWith.length}` : 'Private'}
                              </p>
                            </div>
                          </div>
                          {!capsule.sharing.isShared ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </div>

                      {/* Security Recommendations */}
                      {(!capsule.isEncrypted || !capsule.security.passwordProtected) && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div className="text-sm text-amber-700">
                              <strong>Security Recommendations:</strong>
                              <ul className="mt-1 ml-4 list-disc">
                                {!capsule.security.passwordProtected && (
                                  <li>Enable password protection for this capsule</li>
                                )}
                                {!capsule.isEncrypted && (
                                  <li>Encrypt capsule content for maximum security</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Security Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {capsule.isEncrypted && capsule.security.passwordProtected ? '95' : 
                       capsule.security.passwordProtected ? '75' :
                       capsule.isEncrypted ? '70' : '45'}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {capsule.isEncrypted && capsule.security.passwordProtected ? 'Excellent' :
                       capsule.security.passwordProtected || capsule.isEncrypted ? 'Good' : 'Needs Improvement'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Security Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Security Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    disabled={capsule.security.passwordProtected}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {capsule.security.passwordProtected ? 'Password Protected' : 'Add Password'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    disabled={capsule.isEncrypted}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    {capsule.isEncrypted ? 'Content Encrypted' : 'Encrypt Content'}
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setIsSharingOpen(true)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Sharing Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Tags */}
              {capsule.metadata.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {capsule.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          
          <Dialog open={isSharingOpen} onOpenChange={setIsSharingOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Share "{capsule.title}"</DialogTitle>
                </DialogHeader>
                <CapsuleSharing
                    capsuleId={capsule.id}
                    capsuleTitle={capsule.title}
                    isShared={capsule.sharing.isShared}
                    sharedContacts={capsule.sharing.sharedWith as any[]} // Cast for now, should match types
                    emergencyContacts={capsule.sharing.emergencyContacts}
                    onUpdateSharing={handleUpdateSharing}
                />
            </DialogContent>
          </Dialog>

        </motion.div>
      )}
    </CapsuleUnlockGuard>
  )
}
