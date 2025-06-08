
// 📁 src/app/dashboard/shared/page.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Share2, 
  Users, 
  Clock, 
  Eye,
  Download,
  UserPlus
} from 'lucide-react'

export default function SharedPage() {
  const sharedCapsules = [
    {
      id: '1',
      title: 'Family Emergency Documents',
      sharedBy: 'john.doe@example.com',
      sharedAt: new Date('2024-01-15'),
      permissions: ['view', 'download'],
      expiresAt: new Date('2024-12-31')
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared With Me</h1>
          <p className="text-muted-foreground mt-1">
            Capsules that others have shared with you
          </p>
        </div>
      </div>

      {/* Shared Capsules */}
      {sharedCapsules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No shared capsules</h3>
            <p className="text-muted-foreground">
              When someone shares a capsule with you, it will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sharedCapsules.map((capsule) => (
            <Card key={capsule.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="line-clamp-1">{capsule.title}</span>
                  <Badge variant="secondary">Shared</Badge>
                </CardTitle>
                <CardDescription>
                  Shared by {capsule.sharedBy}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Shared {capsule.sharedAt.toLocaleDateString()}</span>
                  </div>
                  <span className="text-muted-foreground">
                    Expires {capsule.expiresAt.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {capsule.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  )
}
