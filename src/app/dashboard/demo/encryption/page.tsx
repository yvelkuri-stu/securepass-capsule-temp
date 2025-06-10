
// 📁 src/app/dashboard/demo/encryption/page.tsx (UPDATED with file encryption demo)
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Lock, 
  Unlock, 
  Copy, 
  Eye, 
  EyeOff,
  Upload,
  Download,
  File,
  Shield,
  Key,
  AlertTriangle
} from 'lucide-react'
import { EnhancedCryptoService } from '@/lib/enhanced-crypto'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

export default function AdvancedEncryptionDemo() {
  const [plainText, setPlainText] = useState(`{
  "personalInfo": {
    "name": "John Doe",
    "ssn": "123-45-6789",
    "creditCard": "4532-1234-5678-9012"
  },
  "documents": [
    "passport.pdf",
    "tax_returns.pdf"
  ],
  "notes": "Keep this information secure!"
}`)
  
  const [password, setPassword] = useState('')
  const [encryptedData, setEncryptedData] = useState('')
  const [decryptedData, setDecryptedData] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [encryptionMetadata, setEncryptionMetadata] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // File encryption state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [encryptedFile, setEncryptedFile] = useState<Blob | null>(null)
  const [fileEncryptionMetadata, setFileEncryptionMetadata] = useState<any>(null)
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null)
  const [fileProgress, setFileProgress] = useState(0)

  const passwordStrength = password ? EnhancedCryptoService.checkPasswordStrength(password) : null

  // File drop zone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'text/*': ['.txt'],
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0])
        setEncryptedFile(null)
        setDecryptedFile(null)
        setFileProgress(0)
      }
    }
  })

  const handleTextEncrypt = async () => {
    if (!plainText.trim() || !password) {
      toast.error('Please enter content and password')
      return
    }

    setIsProcessing(true)
    
    try {
      const result = await EnhancedCryptoService.encryptText(plainText, password)
      setEncryptedData(result.encryptedData)
      setEncryptionMetadata({
        salt: result.salt,
        iv: result.iv,
        keyHash: result.keyHash
      })
      toast.success('Text encrypted successfully!')
    } catch (error: any) {
      toast.error(`Encryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextDecrypt = async () => {
    if (!encryptedData || !encryptionMetadata || !password) {
      toast.error('Missing encrypted data or password')
      return
    }

    setIsProcessing(true)
    
    try {
      const result = await EnhancedCryptoService.decryptText({
        encryptedData,
        iv: encryptionMetadata.iv,
        salt: encryptionMetadata.salt,
        password
      })
      setDecryptedData(result)
      toast.success('Text decrypted successfully!')
    } catch (error: any) {
      toast.error(`Decryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileEncrypt = async () => {
    if (!selectedFile || !password) {
      toast.error('Please select a file and enter password')
      return
    }

    setIsProcessing(true)
    setFileProgress(0)
    
    try {
      const result = await EnhancedCryptoService.encryptFile(
        selectedFile,
        password,
        (progress) => setFileProgress(progress)
      )
      
      setEncryptedFile(result.encryptedFile)
      setFileEncryptionMetadata(result.metadata)
      toast.success('File encrypted successfully!')
    } catch (error: any) {
      toast.error(`File encryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setFileProgress(0)
    }
  }

  const handleFileDecrypt = async () => {
    if (!encryptedFile || !fileEncryptionMetadata || !password) {
      toast.error('Missing encrypted file or password')
      return
    }

    setIsProcessing(true)
    setFileProgress(0)
    
    try {
      const result = await EnhancedCryptoService.decryptFile(
        encryptedFile,
        fileEncryptionMetadata,
        password,
        (progress) => setFileProgress(progress)
      )
      
      setDecryptedFile(result)
      toast.success('File decrypted successfully!')
    } catch (error: any) {
      toast.error(`File decryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setFileProgress(0)
    }
  }

  const downloadFile = (file: File | Blob, filename: string) => {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const generateSecurePassword = () => {
    const newPassword = EnhancedCryptoService.generateSecurePassword(20)
    setPassword(newPassword)
    toast.success('Secure password generated!')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Encryption Demo</h1>
        <p className="text-muted-foreground mt-1">
          Test client-side encryption for both text and files with AES-256
        </p>
      </div>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            Encryption Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Master Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter encryption password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-8 w-8"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={generateSecurePassword}
                  className="h-8 w-8"
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {passwordStrength && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Password Strength</span>
                  <Badge variant={passwordStrength.isStrong ? 'default' : 'destructive'}>
                    {passwordStrength.isStrong ? 'Strong' : 'Weak'} 
                    ({passwordStrength.score}/8)
                  </Badge>
                </div>
                <Progress value={(passwordStrength.score / 8) * 100} className="h-1" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="text" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Text Encryption</TabsTrigger>
          <TabsTrigger value="files">File Encryption</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle>Original Content</CardTitle>
                <CardDescription>Enter sensitive text data to encrypt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter sensitive data..."
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleTextEncrypt} 
                    disabled={isProcessing || !password || !plainText.trim()}
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Encrypt Text
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleTextDecrypt} 
                    disabled={isProcessing || !encryptedData || !password}
                    variant="outline"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                        Decrypting...
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Decrypt Text
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Text Results */}
            <Card>
              <CardHeader>
                <CardTitle>Encryption Results</CardTitle>
                <CardDescription>Encrypted data and decryption results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Encrypted Data</Label>
                  <Textarea
                    value={encryptedData}
                    readOnly
                    className="min-h-[100px] font-mono text-xs"
                    placeholder="Encrypted data will appear here..."
                  />
                  {encryptedData && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Length: {encryptedData.length} characters</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(encryptedData)
                          toast.success('Encrypted data copied!')
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Decrypted Result</Label>
                  <Textarea
                    value={decryptedData}
                    readOnly
                    className="min-h-[100px] font-mono text-xs"
                    placeholder="Decrypted data will appear here..."
                  />
                  {decryptedData && (
                    <div className="flex items-center space-x-2 text-xs">
                      <Badge variant="default">
                        ✅ Successfully Decrypted
                      </Badge>
                      {decryptedData === plainText && (
                        <Badge variant="default">
                          ✅ Matches Original
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>File Encryption</CardTitle>
                <CardDescription>Upload and encrypt files securely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to select (max 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                    </div>
                  </div>
                )}

                {(isProcessing && fileProgress > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processing...</span>
                      <span>{Math.round(fileProgress)}%</span>
                    </div>
                    <Progress value={fileProgress} className="h-2" />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={handleFileEncrypt} 
                    disabled={isProcessing || !selectedFile || !password}
                    className="flex-1"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Encrypt File
                  </Button>
                  
                  <Button 
                    onClick={handleFileDecrypt} 
                    disabled={isProcessing || !encryptedFile || !password}
                    variant="outline"
                    className="flex-1"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Decrypt File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Results */}
            <Card>
              <CardHeader>
                <CardTitle>File Processing Results</CardTitle>
                <CardDescription>Download encrypted and decrypted files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {encryptedFile && fileEncryptionMetadata && (
                  <div className="p-3 border rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-800">Encrypted File</span>
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          {(encryptedFile.size / 1024 / 1024).toFixed(2)} MB • Binary
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(encryptedFile, `${fileEncryptionMetadata.originalName}.encrypted`)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {decryptedFile && (
                  <div className="p-3 border rounded-lg bg-green-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Unlock className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">Decrypted File</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {decryptedFile.name} • {(decryptedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadFile(decryptedFile, decryptedFile.name)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {fileEncryptionMetadata && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Encryption Metadata</Label>
                    <div className="p-2 bg-muted rounded text-xs font-mono">
                      <div>Salt: {fileEncryptionMetadata.salt.substring(0, 20)}...</div>
                      <div>IV: {fileEncryptionMetadata.iv.substring(0, 20)}...</div>
                      <div>Key Hash: {fileEncryptionMetadata.keyHash.substring(0, 20)}...</div>
                    </div>
                  </div>
                )}

                {!encryptedFile && !decryptedFile && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No processed files yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Security Implementation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <strong className="text-blue-800">🔒 Encryption Specs:</strong>
              <ul className="mt-1 text-blue-700 space-y-1">
                <li>• AES-256-CBC encryption</li>
                <li>• PBKDF2 key derivation</li>
                <li>• 100,000 iterations</li>
                <li>• Random salt & IV per operation</li>
                <li>• SHA-256 key verification</li>
              </ul>
            </div>
            
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong className="text-green-800">✅ Security Features:</strong>
              <ul className="mt-1 text-green-700 space-y-1">
                <li>• Client-side encryption only</li>
                <li>• Zero-knowledge architecture</li>
                <li>• Secure password generation</li>
                <li>• File chunk processing</li>
                <li>• Memory-safe operations</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded">
            <strong className="text-amber-800">⚠️ Important Notes:</strong>
            <ul className="mt-1 text-amber-700 space-y-1">
              <li>• Passwords are never transmitted to servers</li>
              <li>• Lost passwords cannot be recovered</li>
              <li>• Each file gets unique encryption parameters</li>
              <li>• Encrypted files are binary data (.encrypted extension)</li>
              <li>• This is a demo - use strong passwords in production</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
