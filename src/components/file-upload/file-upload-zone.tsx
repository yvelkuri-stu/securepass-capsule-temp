
// 📁 src/components/file-upload/file-upload-zone.tsx (Drag & drop upload component)
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Upload, X, File, Image, Video } from 'lucide-react'
import { StorageService } from '@/lib/storage'
import { toast } from 'sonner'

interface FileUploadZoneProps {
  capsuleId: string
  onFileUploaded: (file: any) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function FileUploadZone({
  capsuleId,
  onFileUploaded,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', 'text/plain']
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadingFiles(acceptedFiles.map(f => f.name))

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setUploadProgress((i / acceptedFiles.length) * 100)

        try {
          const result = await StorageService.uploadFile(file, capsuleId)
          onFileUploaded(result)
          toast.success(`Uploaded ${file.name}`)
        } catch (error: any) {
          toast.error(`Failed to upload ${file.name}: ${error.message}`)
        }
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setUploadingFiles([])
    }
  }, [capsuleId, onFileUploaded])

  const { getRootProps, getInputProps, isDragActive, rejectedFiles } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles,
    disabled: uploading
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to select files
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs">
                  <Image className="h-3 w-3 mr-1" />
                  Images
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  Videos
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <File className="h-3 w-3 mr-1" />
                  Documents
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                Max 50MB per file • {maxFiles} files max
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploading && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading files...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <div className="space-y-1">
                {uploadingFiles.map((fileName, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    📁 {fileName}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {rejectedFiles.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-red-600 mb-2">
              Some files were rejected:
            </h4>
            {rejectedFiles.map(({ file, errors }) => (
              <div key={file.name} className="text-xs text-red-600">
                {file.name}: {errors.map(e => e.message).join(', ')}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}