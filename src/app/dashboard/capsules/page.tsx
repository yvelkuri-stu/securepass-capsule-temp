// 📁 src/app/dashboard/capsules/page.tsx (UPDATED - Fix View Button)
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Plus, 
  Filter, 
  LayoutGrid,
  List,
  FileText,
  Image,
  Video,
  Paperclip,
  QrCode,
  Mic,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  File  
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCapsuleStore } from '@/store/capsules'
import { formatDate, formatFileSize } from '@/lib/utils'
import { DataType } from '@/types'
import { toast } from 'sonner'

const dataTypeIcons: Record<DataType, React.ComponentType<any>> = {
  text: FileText,
  images: Image,
  videos: Video,
  attachments: Paperclip,
  qrCodes: QrCode,
  voiceNotes: Mic
}

const dataTypeColors: Record<DataType, string> = {
  text: 'text-blue-500',
  images: 'text-green-500',
  videos: 'text-purple-500',
  attachments: 'text-orange-500',
  qrCodes: 'text-indigo-500',
  voiceNotes: 'text-pink-500'
}

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

export default function CapsulesPage() {
  const router = useRouter()
  const { capsules, fetchCapsules, deleteCapsule, isLoading } = useCapsuleStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filteredCapsules, setFilteredCapsules] = useState(capsules)
  const [deletingCapsules, setDeletingCapsules] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCapsules()
  }, [fetchCapsules])

  useEffect(() => {
    const filtered = capsules.filter(capsule =>
      capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      capsule.metadata.tags.some(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    setFilteredCapsules(filtered)
  }, [searchQuery, capsules])

  const handleViewCapsule = (capsuleId: string) => {
    router.push(`/dashboard/capsules/${capsuleId}`)
  }

  const handleDeleteCapsule = async (capsuleId: string, title: string) => {
    if (deletingCapsules.has(capsuleId)) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    setDeletingCapsules(prev => new Set(prev).add(capsuleId))
    
    try {
      await deleteCapsule(capsuleId)
      toast.success(`Deleted "${title}"`)
    } catch (error: any) {
      toast.error(`Failed to delete capsule: ${error.message}`)
    } finally {
      setDeletingCapsules(prev => {
        const newSet = new Set(prev)
        newSet.delete(capsuleId)
        return newSet
      })
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Capsules</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Manage your secure data capsules
            </p>
          </div>
          <Link href="/dashboard/capsules/new">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Capsule
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search capsules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" className="flex-shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Capsules Grid/List */}
      <motion.div variants={itemVariants}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 md:p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2 mb-4" />
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 w-6 bg-muted rounded" />
                    <div className="h-6 w-6 bg-muted rounded" />
                  </div>
                  <div className="h-3 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCapsules.length === 0 ? (
          <Card>
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mx-auto w-16 h-16 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base md:text-lg font-semibold mb-2">No capsules found</h3>
              <p className="text-muted-foreground mb-4 text-sm md:text-base">
                {searchQuery ? 'Try adjusting your search terms' : 'Create your first secure data capsule'}
              </p>
              <Link href="/dashboard/capsules/new">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Capsule
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
              : 'space-y-3 md:space-y-4'
          }>
            {filteredCapsules.map((capsule, index) => (
              <motion.div
                key={capsule.id}
                variants={itemVariants}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="pb-2 md:pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 pr-2">
                        <CardTitle className="text-base md:text-lg line-clamp-1">
                          {capsule.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs md:text-sm">
                          {capsule.description || 'No description'}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCapsule(capsule.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/capsules/${capsule.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCapsule(capsule.id, capsule.title)}
                            disabled={deletingCapsules.has(capsule.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deletingCapsules.has(capsule.id) ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 md:space-y-4">
                    {/* Data Types */}
                    <div className="flex items-center space-x-1 md:space-x-2 flex-wrap gap-1">
                      {capsule.dataTypes.slice(0, 3).map((type) => {
                        const Icon = dataTypeIcons[type]
                        return (
                          <div
                            key={type}
                            className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-md"
                          >
                            <Icon className={`h-3 w-3 ${dataTypeColors[type]}`} />
                            <span className="text-xs capitalize">{type}</span>
                          </div>
                        )
                      })}
                      {capsule.dataTypes.length > 3 && (
                        <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-md">
                          <span className="text-xs">+{capsule.dataTypes.length - 3}</span>
                        </div>
                      )}
                    </div>

                    {/* Security Level */}
                    <div className="flex items-center justify-between">
                      <Badge variant={
                        capsule.metadata.securityLevel === 'maximum' ? 'destructive' :
                        capsule.metadata.securityLevel === 'high' ? 'warning' :
                        capsule.metadata.securityLevel === 'medium' ? 'secondary' : 'outline'
                      } className="text-xs">
                        {capsule.metadata.securityLevel} security
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(capsule.metadata.totalSize)}
                      </span>
                    </div>

                    {/* Tags */}
                    {capsule.metadata.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {capsule.metadata.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {capsule.metadata.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{capsule.metadata.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Metadata - Hidden on mobile, shown on larger screens */}
                    <div className="hidden md:block text-xs text-muted-foreground space-y-1">
                      <div>Created: {formatDate(capsule.createdAt)}</div>
                      <div>Last accessed: {formatDate(capsule.lastAccessedAt)}</div>
                    </div>

                    {/* Actions - WITH WORKING VIEW BUTTON */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewCapsule(capsule.id)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Link href={`/dashboard/capsules/${capsule.id}/files`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full">
                          <File className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">Files</span>
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteCapsule(capsule.id, capsule.title)}
                        disabled={deletingCapsules.has(capsule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
