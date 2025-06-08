
// 📁 src/app/dashboard/capsules/[id]/files/page.tsx (Capsule files management page)
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { FileUploadZone } from '@/components/file-upload/file-upload-zone'
import { FileGrid } from '@/components/file-upload/file-grid'
import { FileViewer } from '@/components/file-upload/file-viewer'
import { StorageUsage } from '@/components/file-upload/storage-usage'
import { StorageService } from '@/lib/storage'
import { useCapsuleStore } from '@/store/capsules'
import { toast } from 'sonner'

export default function CapsuleFilesPage() {
  const params = useParams()
  const router = useRouter()
  const capsuleId = params.id as string
  
  const [files, setFiles] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { capsules } = useCapsuleStore()
  
  const capsule = capsules.find(c => c.id === capsuleId)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const capsuleFiles = await StorageService.getCapsuleFiles(capsuleId)
        setFiles(capsuleFiles)
      } catch (error: any) {
        toast.error('Failed to load files')
        console.error('Error loading files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (capsuleId) {
      fetchFiles()
    }
  }, [capsuleId])

  const handleFileUploaded = (newFile: any) => {
    setFiles(prev => [newFile, ...prev])
  }

  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleFileView = (file: any) => {
    setSelectedFile(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {capsule ? `${capsule.title} - Files` : 'Capsule Files'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage files for this capsule
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Upload zone */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Add images, videos, documents and other files to this capsule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                capsuleId={capsuleId}
                onFileUploaded={handleFileUploaded}
              />
            </CardContent>
          </Card>

          {/* Files grid */}
          <Card>
            <CardHeader>
              <CardTitle>Files ({files.length})</CardTitle>
              <CardDescription>
                Manage your uploaded files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileGrid
                files={files}
                onFileDeleted={handleFileDeleted}
                onFileView={handleFileView}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StorageUsage />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Supported Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <strong>Images:</strong> JPEG, PNG, GIF, WebP
              </div>
              <div>
                <strong>Videos:</strong> MP4, WebM
              </div>
              <div>
                <strong>Documents:</strong> PDF, TXT, DOC, DOCX, XLS, XLSX
              </div>
              <div className="text-muted-foreground mt-2">
                Maximum 50MB per file
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File viewer modal */}
      <FileViewer
        file={selectedFile}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  )
}
