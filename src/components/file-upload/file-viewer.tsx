// 📁 src/components/file-upload/file-viewer.tsx (FIXED - Next.js Image)
'use client'

import { useState } from 'react'
import Image from 'next/image' // FIXED: Added Next.js Image import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, X } from 'lucide-react'
import { StorageService } from '@/lib/storage'

interface FileViewerProps {
  file: any | null
  isOpen: boolean
  onClose: () => void
}

export function FileViewer({ file, isOpen, onClose }: FileViewerProps) {
  const [imageError, setImageError] = useState(false)

  if (!file) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFileContent = () => {
    if (file.fileType.startsWith('image/')) {
      return (
        <div className="relative">
          {!imageError ? (
            <div className="relative w-full max-h-[70vh] mx-auto">
              <Image
                src={file.url}
                alt={file.fileName}
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <p className="text-muted-foreground">Failed to load image</p>
            </div>
          )}
        </div>
      )
    }

    if (file.fileType.startsWith('video/')) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-[70vh] mx-auto rounded-lg"
        >
          Your browser does not support video playback.
        </video>
      )
    }

    if (file.fileType === 'application/pdf') {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={file.url}
            className="w-full h-full rounded-lg border"
            title={file.fileName}
          />
        </div>
      )
    }

    if (file.fileType === 'text/plain') {
      return (
        <div className="bg-muted p-4 rounded-lg max-h-[70vh] overflow-y-auto">
          <iframe
            src={file.url}
            className="w-full h-96 border-0"
            title={file.fileName}
          />
        </div>
      )
    }

    // For other file types, show download option
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">
            {StorageService.getFileTypeIcon(file.fileType)}
          </span>
        </div>
        <p className="text-lg font-medium mb-2">{file.fileName}</p>
        <p className="text-muted-foreground mb-4">
          Preview not available for this file type
        </p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download to View
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="line-clamp-1">{file.fileName}</DialogTitle>
              <Badge variant="secondary">
                {file.fileType.split('/')[1]?.toUpperCase() || 'FILE'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {StorageService.formatFileSize(file.fileSize)} • Uploaded {new Date().toLocaleDateString()}
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          {renderFileContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}