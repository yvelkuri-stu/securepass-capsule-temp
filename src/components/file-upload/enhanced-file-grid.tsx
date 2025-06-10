// 📁 src/components/file-upload/enhanced-file-grid.tsx (FIXED - Next.js Image)
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image' // FIXED: Added Next.js Image import
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Download, 
  Trash2, 
  Eye, 
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText,
  File,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  Share2,
  Lock,
  Unlock
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { StorageService } from '@/lib/storage'
import { CryptoService } from '@/lib/crypto'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface FileItem {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  thumbnailPath?: string
  createdAt: Date
  isEncrypted?: boolean
}

interface EnhancedFileGridProps {
  files: FileItem[]
  onFileDeleted: (fileId: string) => void
  onFileView: (file: FileItem) => void
  onFileEncrypt?: (fileId: string) => void
  capsuleId: string
}

export function EnhancedFileGrid({ 
  files, 
  onFileDeleted, 
  onFileView, 
  onFileEncrypt,
  capsuleId 
}: EnhancedFileGridProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())
  const [encryptingFiles, setEncryptingFiles] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // Filter and sort files
  const filteredAndSortedFiles = files
    .filter(file => 
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.fileType.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fileName.localeCompare(b.fileName)
        case 'size':
          return b.fileSize - a.fileSize
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const handleDelete = async (fileId: string, fileName: string) => {
    if (deletingFiles.has(fileId)) return

    setDeletingFiles(prev => new Set(prev).add(fileId))
    
    try {
      await StorageService.deleteFile(fileId)
      onFileDeleted(fileId)
      toast.success(`Deleted ${fileName}`)
    } catch (error: any) {
      toast.error(`Failed to delete file: ${error.message}`)
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return

    const fileIds = Array.from(selectedFiles)
    toast.promise(
      Promise.all(fileIds.map(id => {
        const file = files.find(f => f.id === id)
        if (file) return handleDelete(id, file.fileName)
      })),
      {
        loading: `Deleting ${fileIds.length} files...`,
        success: `Deleted ${fileIds.length} files`,
        error: 'Failed to delete some files'
      }
    )
    setSelectedFiles(new Set())
  }

  const handleEncrypt = async (fileId: string, fileName: string) => {
    if (!onFileEncrypt || encryptingFiles.has(fileId)) return

    setEncryptingFiles(prev => new Set(prev).add(fileId))
    
    try {
      await onFileEncrypt(fileId)
      toast.success(`Encrypted ${fileName}`)
    } catch (error: any) {
      toast.error(`Failed to encrypt file: ${error.message}`)
    } finally {
      setEncryptingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleDownload = (file: FileItem) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)))
    }
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <File className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No files uploaded yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {selectedFiles.size > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {selectedFiles.size} selected
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                By Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('size')}>
                By Size
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                By Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
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

      {/* Files Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredAndSortedFiles.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`group hover:shadow-md transition-all cursor-pointer ${
                  selectedFiles.has(file.id) ? 'ring-2 ring-primary' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-3">
                      {file.fileType.startsWith('image/') ? (
                        <Image
                          src={file.url}
                          alt={file.fileName}
                          fill
                          className="object-cover rounded-md cursor-pointer"
                          onClick={() => onFileView(file)}
                        />
                      ) : file.fileType.startsWith('video/') ? (
                        <video
                          src={file.url}
                          className="w-full h-full object-cover rounded-md cursor-pointer"
                          onClick={() => onFileView(file)}
                          preload="metadata"
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-muted rounded-md flex items-center justify-center cursor-pointer"
                          onClick={() => onFileView(file)}
                        >
                          <div className="text-center">
                            {getFileIcon(file.fileType)}
                            <p className="text-xs mt-2 text-muted-foreground">
                              {file.fileType.split('/')[1]?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Selection checkbox */}
                      <div className="absolute top-2 left-2">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 text-primary rounded"
                        />
                      </div>

                      {/* Security badge */}
                      <div className="absolute top-2 right-2">
                        {file.isEncrypted ? (
                          <Badge variant="default" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Encrypted
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <Unlock className="h-3 w-3 mr-1" />
                            Plain
                          </Badge>
                        )}
                      </div>

                      {/* Actions menu */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onFileView(file)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            {onFileEncrypt && (
                              <DropdownMenuItem
                                onClick={() => handleEncrypt(file.id, file.fileName)}
                                disabled={encryptingFiles.has(file.id) || file.isEncrypted}
                              >
                                <Lock className="h-4 w-4 mr-2" />
                                {encryptingFiles.has(file.id) ? 'Encrypting...' : 'Encrypt'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file.id, file.fileName)}
                              disabled={deletingFiles.has(file.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {deletingFiles.has(file.id) ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* File info */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium line-clamp-1" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{StorageService.formatFileSize(file.fileSize)}</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          <div className="flex items-center p-2 border-b">
            <input
              type="checkbox"
              checked={selectedFiles.size === files.length && files.length > 0}
              onChange={selectAll}
              className="w-4 h-4 text-primary rounded mr-4"
            />
            <div className="flex-1 grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <span>Name</span>
              <span>Size</span>
              <span>Type</span>
              <span>Modified</span>
            </div>
            <div className="w-20"></div>
          </div>

          <AnimatePresence>
            {filteredAndSortedFiles.map((file) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                  selectedFiles.has(file.id) ? 'bg-primary/5 border-primary' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="w-4 h-4 text-primary rounded mr-4"
                />
                
                <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.fileType)}
                    <span className="font-medium line-clamp-1">{file.fileName}</span>
                    {file.isEncrypted && (
                      <Lock className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {StorageService.formatFileSize(file.fileSize)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {file.fileType.split('/')[1]?.toUpperCase()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="w-20 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onFileView(file)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(file.id, file.fileName)}
                        disabled={deletingFiles.has(file.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingFiles.has(file.id) ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredAndSortedFiles.length === 0 && searchQuery && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No files match your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}