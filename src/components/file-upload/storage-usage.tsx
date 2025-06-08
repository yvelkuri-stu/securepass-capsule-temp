
// 📁 src/components/file-upload/storage-usage.tsx (Storage usage indicator)
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { HardDrive } from 'lucide-react'
import { StorageService } from '@/lib/storage'

export function StorageUsage() {
  const [usage, setUsage] = useState<{ used: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const storageUsage = await StorageService.getStorageUsage()
        setUsage(storageUsage)
      } catch (error) {
        console.error('Failed to fetch storage usage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-24 mb-1" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return null
  }

  const usagePercentage = (usage.used / usage.total) * 100
  const remainingSpace = usage.total - usage.used

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-sm">
          <HardDrive className="h-4 w-4 mr-2" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>{StorageService.formatFileSize(usage.used)} used</span>
          <span className="text-muted-foreground">
            {StorageService.formatFileSize(usage.total)} total
          </span>
        </div>
        
        <Progress value={usagePercentage} className="h-2" />
        
        <div className="flex items-center justify-between">
          <Badge 
            variant={usagePercentage > 90 ? 'destructive' : usagePercentage > 70 ? 'warning' : 'secondary'}
            className="text-xs"
          >
            {Math.round(usagePercentage)}% used
          </Badge>
          <span className="text-xs text-muted-foreground">
            {StorageService.formatFileSize(remainingSpace)} remaining
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
