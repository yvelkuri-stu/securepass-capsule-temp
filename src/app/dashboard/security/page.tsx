// 📁 src/app/dashboard/security/page.tsx (New Security Dashboard)
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Fingerprint,
  Smartphone,
  Mail,
  FileText,
  Activity,
  TrendingUp,
  Users,
  Download
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCapsuleStore } from '@/store/capsules'
import { formatDate } from '@/lib/utils'

interface SecurityMetrics {
  overallScore: number
  encryptedFiles: number
  totalFiles: number
  protectedCapsules: number
  totalCapsules: number
  mfaEnabled: boolean
  biometricEnabled: boolean
  recentActivity: SecurityActivity[]
  threats: SecurityThreat[]
}

interface SecurityActivity {
  id: string
  type: 'login' | 'access' | 'encryption' | 'sharing' | 'password_change'
  description: string
  timestamp: Date
  risk: 'low' | 'medium' | 'high'
  location?: string
}

interface SecurityThreat {
  id: string
  type: 'weak_password' | 'unencrypted_files' | 'failed_login' | 'suspicious_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendation: string
  timestamp: Date
}

export default function SecurityDashboard() {
  const { user } = useAuth()
  const { capsules } = useCapsuleStore()
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const calculateMetrics = async () => {
      // Simulate loading real metrics
      await new Promise(resolve => setTimeout(resolve, 1000))

      const encryptedFiles = 15 // Would calculate from actual data
      const totalFiles = 42
      const protectedCapsules = capsules.filter(c => c.security.passwordProtected).length
      const totalCapsules = capsules.length

      const mockMetrics: SecurityMetrics = {
        overallScore: 85,
        encryptedFiles,
        totalFiles,
        protectedCapsules,
        totalCapsules,
        mfaEnabled: user?.mfaEnabled || false,
        biometricEnabled: true,
        recentActivity: [
          {
            id: '1',
            type: 'login',
            description: 'Successful login from Chrome on Windows',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            risk: 'low',
            location: 'Menifee, CA'
          },
          {
            id: '2',
            type: 'encryption',
            description: 'File encrypted in Personal Documents',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            risk: 'low'
          },
          {
            id: '3',
            type: 'access',
            description: 'Capsule accessed: Family Photos',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            risk: 'low'
          }
        ],
        threats: [
          {
            id: '1',
            type: 'unencrypted_files',
            severity: 'medium',
            description: `${totalFiles - encryptedFiles} files are not encrypted`,
            recommendation: 'Enable file encryption for better security',
            timestamp: new Date()
          },
          {
            id: '2',
            type: 'weak_password',
            severity: 'low',
            description: 'Some capsules use weak passwords',
            recommendation: 'Update to stronger passwords with special characters',
            timestamp: new Date()
          }
        ]
      }

      setMetrics(mockMetrics)
      setIsLoading(false)
    }

    calculateMetrics()
  }, [capsules, user])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500'
    if (score >= 70) return 'text-yellow-500'
    if (score >= 50) return 'text-orange-500'
    return 'text-red-500'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200'
      case 'high': return 'text-orange-500 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-500 bg-blue-50 border-blue-200'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Security Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage your account security
        </p>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}%
              </div>
              <p className="text-sm text-muted-foreground mb-4">Security Score</p>
              <Progress value={metrics.overallScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.overallScore >= 90 ? 'Excellent' :
                 metrics.overallScore >= 70 ? 'Good' :
                 metrics.overallScore >= 50 ? 'Fair' : 'Needs Improvement'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Encrypted Files</p>
                <p className="text-2xl font-bold">
                  {metrics.encryptedFiles}/{metrics.totalFiles}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.encryptedFiles / metrics.totalFiles) * 100)}% encrypted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Protected Capsules</p>
                <p className="text-2xl font-bold">
                  {metrics.protectedCapsules}/{metrics.totalCapsules}
                </p>
                <p className="text-xs text-muted-foreground">
                  Password protected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Fingerprint className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Authentication</p>
                <div className="flex space-x-1 mt-1">
                  <Badge variant={metrics.mfaEnabled ? 'default' : 'secondary'} className="text-xs">
                    2FA: {metrics.mfaEnabled ? 'On' : 'Off'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Multi-factor status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
              <TabsTrigger value="threats" className="flex-1">Threats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Security Features Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Security Features</CardTitle>
                  <CardDescription>Current status of your security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">File Encryption</p>
                          <p className="text-sm text-muted-foreground">Client-side encryption</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Two-Factor Auth</p>
                          <p className="text-sm text-muted-foreground">App-based 2FA</p>
                        </div>
                      </div>
                      {metrics.mfaEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Fingerprint className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Biometric Lock</p>
                          <p className="text-sm text-muted-foreground">Face/Touch ID</p>
                        </div>
                      </div>
                      {metrics.biometricEnabled ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                      )}
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Activity className="h-5 w-5 text-teal-500" />
                        <div>
                          <p className="font-medium">Access Logging</p>
                          <p className="text-sm text-muted-foreground">Activity tracking</p>
                        </div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Encryption Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Encryption Overview</CardTitle>
                  <CardDescription>Status of encrypted content across your capsules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>File Encryption Rate</span>
                      <span className="font-medium">
                        {Math.round((metrics.encryptedFiles / metrics.totalFiles) * 100)}%
                      </span>
                    </div>
                    <Progress value={(metrics.encryptedFiles / metrics.totalFiles) * 100} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{metrics.encryptedFiles}</div>
                        <div className="text-sm text-green-700">Encrypted Files</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {metrics.totalFiles - metrics.encryptedFiles}
                        </div>
                        <div className="text-sm text-orange-700">Unencrypted Files</div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full">
                      <Lock className="h-4 w-4 mr-2" />
                      Encrypt All Files
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Activity</CardTitle>
                  <CardDescription>Latest security-related events on your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        {getRiskIcon(activity.risk)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(activity.timestamp)}
                            </span>
                            {activity.location && (
                              <Badge variant="outline" className="text-xs">
                                {activity.location}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="threats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Recommendations</CardTitle>
                  <CardDescription>Identified security issues and recommended actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.threats.map((threat) => (
                      <div key={threat.id} className={`p-4 border rounded-lg ${getSeverityColor(threat.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="font-medium">{threat.description}</span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {threat.severity}
                              </Badge>
                            </div>
                            <p className="text-sm mb-3">{threat.recommendation}</p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                Fix Now
                              </Button>
                              <Button size="sm" variant="ghost">
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Security Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Smartphone className="h-4 w-4 mr-2" />
                Setup 2FA
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Security Report
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                View Audit Log
              </Button>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Use Strong Passwords</p>
                    <p className="text-blue-700 text-xs">Mix uppercase, lowercase, numbers, and symbols</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Lock className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Enable Encryption</p>
                    <p className="text-green-700 text-xs">Encrypt sensitive files before upload</p>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Fingerprint className="h-4 w-4 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-purple-800">Use Biometrics</p>
                    <p className="text-purple-700 text-xs">Add Face ID or Touch ID for quick access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Security Scan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-500">✓</div>
                <p className="text-sm font-medium">Last scan: 2 hours ago</p>
                <p className="text-xs text-muted-foreground">No threats detected</p>
                <Button variant="outline" size="sm" className="w-full">
                  Run New Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}