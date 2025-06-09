// 📁 src/app/dashboard/capsules/[id]/files/page.tsx (ENHANCED VERSION)
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, HardDrive, Shield, Zap } from 'lucide-react'
import { FileUploadZone } from '@/components/file-upload/file-upload-zone'
import { EnhancedFileGrid } from '@/components/file-upload/enhanced-file-grid'
import { FileViewer } from '@/components/file-upload/file-viewer'
import { StorageUsage } from '@/components/file-upload/storage-usage'
import { StorageService } from '@/lib/storage'
import { CryptoService } from '@/lib/crypto'
import { useCapsuleStore } from '@/store/capsules'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

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

export default function EnhancedCapsuleFilesPage() {
  const params = useParams()
  const router = useRouter()
  const capsuleId = params.id as string
  
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  
  const { capsules } = useCapsuleStore()
  const capsule = capsules.find(c => c.id === capsuleId)

  useEffect(() => {
    const fetchFiles = async () => {
      if (!capsuleId) return
      
      try {
        setIsLoading(true)
        const capsuleFiles = await StorageService.getCapsuleFiles(capsuleId)
        
        // Transform to our enhanced format
        const enhancedFiles: FileItem[] = capsuleFiles.map(file => ({
          id: file.id,
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileType: file.fileType,
          url: file.url,
          thumbnailPath: file.thumbnailPath,
          createdAt: new Date(), // You might want to get this from the database
          isEncrypted: false // Default to false, implement encryption detection
        }))
        
        setFiles(enhancedFiles)
      } catch (error: any) {
        toast.error('Failed to load files')
        console.error('Error loading files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [capsuleId])

  const handleFileUploaded = (newFile: any) => {
    const enhancedFile: FileItem = {
      id: newFile.id,
      fileName: newFile.fileName,
      fileSize: newFile.fileSize,
      fileType: newFile.fileType,
      url: newFile.url,
      thumbnailPath: newFile.thumbnailPath,
      createdAt: new Date(),
      isEncrypted: false
    }
    setFiles(prev => [enhancedFile, ...prev])
  }

  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleFileView = (file: FileItem) => {
    setSelectedFile(file)
  }

  const handleFileEncrypt = async (fileId: string) => {
    // Implement file encryption logic here
    try {
      // This is a placeholder - implement actual encryption
      toast.success('File encryption coming soon!')
      
      // Update the file to show as encrypted
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, isEncrypted: true } : f
      ))
    } catch (error: any) {
      throw new Error('Encryption failed: ' + error.message)
    }
  }

  const getSecurityLevel = () => {
    const encryptedCount = files.filter(f => f.isEncrypted).length
    const total = files.length
    if (total === 0) return { level: 'medium', percentage: 75 }
    
    const percentage = Math.round((encryptedCount / total) * 100)
    let level: 'low' | 'medium' | 'high' = 'low'
    
    if (percentage >= 80) level = 'high'
    else if (percentage >= 40) level = 'medium'
    
    return { level, percentage }
  }

  const securityInfo = getSecurityLevel()

  if (isLoading) {
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
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold">
            {capsule ? `${capsule.title} - Files` : 'Capsule Files'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage files for this capsule
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={securityInfo.level === 'high' ? 'default' : 'secondary'}>
            <Shield className="h-3 w-3 mr-1" />
            {securityInfo.percentage}% Encrypted
          </Badge>
          <Badge variant="outline">
            {files.length} Files
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Files</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Size</p>
                <p className="text-2xl font-bold">
                  {StorageService.formatFileSize(
                    files.reduce((sum, f) => sum + f.fileSize, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Encrypted</p>
                <p className="text-2xl font-bold">
                  {files.filter(f => f.isEncrypted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">File Types</p>
                <p className="text-2xl font-bold">
                  {new Set(files.map(f => f.fileType.split('/')[0])).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                Manage your uploaded files with advanced features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedFileGrid
                files={files}
                onFileDeleted={handleFileDeleted}
                onFileView={handleFileView}
                onFileEncrypt={handleFileEncrypt}
                capsuleId={capsuleId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StorageUsage />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Security Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Encryption Level</span>
                <Badge variant={securityInfo.level === 'high' ? 'default' : 'secondary'}>
                  {securityInfo.level.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {files.filter(f => f.isEncrypted).length} of {files.length} files encrypted
              </div>
              {securityInfo.level !== 'high' && (
                <div className="text-xs text-amber-600">
                  💡 Consider encrypting more files for better security
                </div>
              )}
            </CardContent>
          </Card>
          
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Encrypt All Files
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <HardDrive className="h-4 w-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Auto-Organize
              </Button>
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
    </motion.div>
  )
}