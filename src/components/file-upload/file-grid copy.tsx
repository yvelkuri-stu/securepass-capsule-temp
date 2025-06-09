// 📁 src/components/file-upload/file-grid.tsx (Display uploaded files)
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Trash2, 
  Eye, 
  MoreVertical,
  Image as ImageIcon,
  Video,
  FileText,
  File
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StorageService } from '@/lib/storage'
import { toast } from 'sonner'

interface FileGridProps {
  files: any[]
  onFileDeleted: (fileId: string) => void
  onFileView: (file: any) => void
}

export function FileGrid({ files, onFileDeleted, onFileView }: FileGridProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set())

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

  const handleDownload = (file: any) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <Card key={file.id} className="group hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="aspect-square relative mb-3">
              {file.fileType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-full h-full object-cover rounded-md cursor-pointer"
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
                      {StorageService.getFileTypeIcon(file.fileType)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* File type badge */}
              <Badge
                variant="secondary"
                className="absolute top-2 left-2 text-xs"
              >
                {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>

              {/* Actions menu */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <p className="text-xs text-muted-foreground">
                {StorageService.formatFileSize(file.fileSize)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
