// 📁 src/app/dashboard/demo/encryption/page.tsx (Demo page to show encryption)
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Lock, 
  Unlock, 
  Copy, 
  Eye, 
  EyeOff,
  Database,
  Shield,
  Key,
  AlertTriangle
} from 'lucide-react'
import { EnhancedCryptoService } from '@/lib/enhanced-crypto'
import { toast } from 'sonner'

export default function EncryptionDemo() {
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

  const handleEncrypt = async () => {
    if (!plainText.trim()) {
      toast.error('Please enter some content to encrypt')
      return
    }

    if (!password) {
      toast.error('Please enter a password')
      return
    }

    setIsProcessing(true)
    
    try {
      console.log('🔒 Starting encryption...')
      console.log('📝 Original content:', plainText)
      console.log('🔑 Password:', password)
      
      const result = await EnhancedCryptoService.encryptText(plainText, password)
      
      console.log('✅ Encryption complete!')
      console.log('🔐 Encrypted data:', result.encryptedData.substring(0, 100) + '...')
      console.log('🧂 Salt:', result.salt)
      console.log('🎲 IV:', result.iv)
      console.log('🔑 Key hash:', result.keyHash)
      
      setEncryptedData(result.encryptedData)
      setEncryptionMetadata({
        salt: result.salt,
        iv: result.iv,
        keyHash: result.keyHash
      })
      
      toast.success('Content encrypted successfully!')
      
    } catch (error: any) {
      toast.error(`Encryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecrypt = async () => {
    if (!encryptedData || !encryptionMetadata) {
      toast.error('No encrypted data to decrypt')
      return
    }

    if (!password) {
      toast.error('Please enter the password')
      return
    }

    setIsProcessing(true)
    
    try {
      console.log('🔓 Starting decryption...')
      console.log('🔐 Encrypted data length:', encryptedData.length)
      console.log('🔑 Using password:', password)
      
      const result = await EnhancedCryptoService.decryptText({
        encryptedData,
        iv: encryptionMetadata.iv,
        salt: encryptionMetadata.salt,
        password
      })
      
      console.log('✅ Decryption complete!')
      console.log('📝 Decrypted content:', result)
      
      setDecryptedData(result)
      toast.success('Content decrypted successfully!')
      
    } catch (error: any) {
      console.error('❌ Decryption failed:', error)
      toast.error(`Decryption failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateSecurePassword = () => {
    const newPassword = EnhancedCryptoService.generateSecurePassword(16)
    setPassword(newPassword)
    toast.success('Secure password generated!')
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const passwordStrength = password ? EnhancedCryptoService.checkPasswordStrength(password) : null

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Encryption Demo</h1>
        <p className="text-muted-foreground mt-1">
          See how your sensitive data is encrypted before being stored in the database
        </p>
      </div>

      {/* Explanation */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-2">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <strong>How It Works:</strong> When you password-protect a capsule, all content is encrypted 
              with AES-256 encryption in your browser before being sent to our servers. The database only 
              stores the encrypted data - we never see your actual content.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Encryption Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                  <div className="text-xs">
                    <Badge variant={passwordStrength.isStrong ? 'default' : 'destructive'}>
                      {passwordStrength.isStrong ? 'Strong' : 'Weak'} Password
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content to Encrypt</Label>
                <Textarea
                  id="content"
                  placeholder="Enter sensitive data (JSON, text, etc.)"
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={handleEncrypt} 
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
                      Encrypt Data
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleDecrypt} 
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
                      Decrypt Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Tabs defaultValue="encrypted" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="encrypted">Encrypted</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="decrypted">Decrypted</TabsTrigger>
            </TabsList>

            <TabsContent value="encrypted">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Database className="h-5 w-5 mr-2" />
                      What's Stored in Database
                    </span>
                    {encryptedData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(encryptedData, 'Encrypted data')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    This encrypted blob is what actually gets saved to our database
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {encryptedData ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded font-mono text-xs break-all max-h-64 overflow-y-auto">
                        {encryptedData}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Length: {encryptedData.length} characters
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No encrypted data yet. Click "Encrypt Data" to see the result.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Encryption Metadata
                  </CardTitle>
                  <CardDescription>
                    Additional data needed for decryption (stored separately)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {encryptionMetadata ? (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium">Salt (for key derivation)</Label>
                        <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                          {encryptionMetadata.salt}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">IV (initialization vector)</Label>
                        <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                          {encryptionMetadata.iv}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Key Hash (for verification)</Label>
                        <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                          {encryptionMetadata.keyHash}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No metadata yet. Encrypt some data first.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="decrypted">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Unlock className="h-5 w-5 mr-2" />
                      Decrypted Result
                    </span>
                    {decryptedData && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(decryptedData, 'Decrypted data')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Your original content, restored from the encrypted data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {decryptedData ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-50 border border-green-200 rounded font-mono text-sm max-h-64 overflow-y-auto">
                        {decryptedData}
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <Badge variant="default" className="text-xs">
                          ✅ Successfully Decrypted
                        </Badge>
                        {decryptedData === plainText && (
                          <Badge variant="default" className="text-xs">
                            ✅ Matches Original
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Unlock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No decrypted data yet. Encrypt data first, then decrypt it.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Security Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
            Security Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <strong className="text-green-800">✅ What We DO:</strong>
              <ul className="mt-1 text-green-700 space-y-1">
                <li>• Encrypt data in your browser (client-side)</li>
                <li>• Use AES-256 encryption with 100,000 iterations</li>
                <li>• Store only encrypted blobs in our database</li>
                <li>• Generate unique salt and IV for each encryption</li>
              </ul>
            </div>
            
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <strong className="text-red-800">❌ What We DON'T:</strong>
              <ul className="mt-1 text-red-700 space-y-1">
                <li>• Never see your actual content or passwords</li>
                <li>• Never store decryption keys on our servers</li>
                <li>• Cannot recover your data if you lose the password</li>
                <li>• Don't have backdoors or master keys</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}