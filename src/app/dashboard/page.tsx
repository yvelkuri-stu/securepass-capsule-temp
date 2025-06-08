// 📁 src/app/dashboard/page.tsx (Mobile-responsive dashboard)
'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Archive, 
  Share2, 
  AlertTriangle, 
  Shield, 
  Plus,
  TrendingUp,
  Clock,
  Users,
  Eye
} from 'lucide-react'
import { useCapsuleStore } from '@/store/capsules'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { dashboardStats, fetchDashboardStats, capsules, fetchCapsules } = useCapsuleStore()

  useEffect(() => {
    fetchDashboardStats()
    fetchCapsules()
  }, [fetchDashboardStats, fetchCapsules])

  const stats = [
    {
      title: 'Total Capsules',
      value: dashboardStats?.totalCapsules || 0,
      icon: Archive,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Shared Items',
      value: dashboardStats?.sharedItems || 0,
      icon: Share2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Pending Alerts',
      value: dashboardStats?.pendingAlerts || 0,
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Security Score',
      value: `${dashboardStats?.securityScore || 0}%`,
      icon: Shield,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user?.displayName}!</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Here's what's happening with your secure data capsules.
            </p>
          </div>
          <Link href="/dashboard/capsules/new">
            <Button size="lg" className="shadow-lg w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Capsule
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards - Responsive Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-lg md:text-2xl font-bold mt-1 md:mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-2 md:p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Security Overview - Responsive Layout */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Security Score */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Shield className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
              Security Score
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Your overall security posture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {user?.securityScore}%
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">Excellent Security</p>
            </div>
            <Progress value={user?.securityScore} className="h-2 md:h-3" />
            <div className="space-y-2 text-xs md:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Encryption</span>
                <Badge variant="success" className="text-xs">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">2FA</span>
                <Badge variant={user?.mfaEnabled ? "success" : "warning"} className="text-xs">
                  {user?.mfaEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="flex items-center text-lg md:text-xl">
              <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Your latest capsule interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {dashboardStats?.recentActivity?.map((activity, index) => (
                <div key={activity.id} className="flex items-center space-x-3 md:space-x-4 p-2 md:p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0">
                    {activity.type === 'created' && <Plus className="h-3 w-3 md:h-4 md:w-4 text-green-500" />}
                    {activity.type === 'accessed' && <Eye className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />}
                    {activity.type === 'shared' && <Users className="h-3 w-3 md:h-4 md:w-4 text-purple-500" />}
                    {activity.type === 'modified' && <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium line-clamp-1">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-6 md:py-8 text-muted-foreground">
                  <Clock className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions - Mobile-Responsive Grid */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs md:text-sm">Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Link href="/dashboard/capsules/new">
                <Button variant="outline" className="h-16 md:h-20 w-full flex-col space-y-1 md:space-y-2">
                  <Plus className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="text-xs md:text-sm">Create Capsule</span>
                </Button>
              </Link>
              <Link href="/dashboard/capsules">
                <Button variant="outline" className="h-16 md:h-20 w-full flex-col space-y-1 md:space-y-2">
                  <Archive className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="text-xs md:text-sm">Browse Capsules</span>
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" className="h-16 md:h-20 w-full flex-col space-y-1 md:space-y-2">
                  <Shield className="h-5 w-5 md:h-6 md:w-6" />
                  <span className="text-xs md:text-sm">Security Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
