// 📁 src/components/capsules/ai-enhanced-capsule-form.tsx (NEW - AI-Powered Creation)
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Lightbulb, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  Sparkles,
  Target,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AIContentService, ContentAnalysis, DuplicateMatch } from '@/lib/ai-content-service'
import { useCapsuleStore } from '@/store/capsules'
import { toast } from 'sonner'

interface AIEnhancedCapsuleFormProps {
  onSubmit: (data: any) => void
  isLoading?: boolean
}

export function AIEnhancedCapsuleForm({ onSubmit, isLoading }: AIEnhancedCapsuleFormProps) {
  const { capsules } = useCapsuleStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: '',
    securityLevel: 'medium' as const,
    enablePasswordProtection: false,
    password: ''
  })

  // AI Analysis State
  const [aiAnalysis, setAIAnalysis] = useState<ContentAnalysis | null>(null)
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiEnabled, setAIEnabled] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Trigger AI analysis when content changes
  useEffect(() => {
    if (!aiEnabled || !formData.content.trim()) {
      setAIAnalysis(null)
      setDuplicateMatches([])
      setSuggestedTags([])
      return
    }

    const debounceTimer = setTimeout(() => {
      performAIAnalysis()
    }, 1000) // Debounce for 1 second

    return () => clearTimeout(debounceTimer)
  }, [formData.content, aiEnabled])

  const performAIAnalysis = async () => {
    if (!formData.content.trim()) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 15, 90))
      }, 200)

      // Analyze content
      const analysis = await AIContentService.analyzeTextContent(formData.content)
      setAIAnalysis(analysis)

      // Check for duplicates
      const duplicates = await AIContentService.detectDuplicates(formData.content, capsules)
      setDuplicateMatches(duplicates)

      // Get existing tags from all capsules
      const existingTags = capsules.flatMap(c => c.metadata.tags)
      const suggested = await AIContentService.suggestTags(formData.content, existingTags)
      setSuggestedTags(suggested)

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      // Auto-apply suggestions if confidence is high
      if (analysis.confidence > 80) {
        setFormData(prev => ({
          ...prev,
          securityLevel: analysis.suggestedSecurity,
          enablePasswordProtection: analysis.riskLevel > 70
        }))

        if (!prev.title && analysis.summary) {
          setFormData(prev => ({
            ...prev,
            title: analysis.summary.substring(0, 50)
          }))
        }
      }

      toast.success('AI analysis complete!')
    } catch (error) {
      console.error('AI analysis failed:', error)
      toast.error('AI analysis failed - continuing without suggestions')
    } finally {
      setIsAnalyzing(false)
      setTimeout(() => setAnalysisProgress(0), 2000)
    }
  }

  const applySuggestedTag = (tag: string) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ')
      setFormData(prev => ({ ...prev, tags: newTags }))
      setSuggestedTags(prev => prev.filter(t => t !== tag))
      toast.success(`Added tag: ${tag}`)
    }
  }

  const applyAISuggestions = () => {
    if (!aiAnalysis) return

    setFormData(prev => ({
      ...prev,
      securityLevel: aiAnalysis.suggestedSecurity,
      enablePasswordProtection: aiAnalysis.riskLevel > 70,
      tags: prev.tags ? `${prev.tags}, ${aiAnalysis.tags.join(', ')}` : aiAnalysis.tags.join(', ')
    }))

    setSuggestedTags([])
    toast.success('Applied AI suggestions!')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      aiAnalysis,
      duplicateMatches
    })
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-500'
      case 'medium': return 'text-yellow-500'
      case 'high': return 'text-orange-500'
      case 'maximum': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getRiskLevelColor = (risk: number) => {
    if (risk < 30) return 'text-green-500'
    if (risk < 60) return 'text-yellow-500'
    if (risk < 80) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Analysis Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI-Powered Creation</CardTitle>
            </div>
            <Switch
              checked={aiEnabled}
              onCheckedChange={setAIEnabled}
            />
          </div>
          <CardDescription>
            Enable AI analysis for smart categorization, security suggestions, and duplicate detection
          </CardDescription>
        </CardHeader>
        
        {aiEnabled && (
          <CardContent>
            <div className="space-y-3">
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 animate-pulse text-primary" />
                      <span>Analyzing content...</span>
                    </span>
                    <span>{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}

              {aiAnalysis && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{aiAnalysis.confidence}%</div>
                    <div className="text-xs text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getSecurityLevelColor(aiAnalysis.suggestedSecurity)}`}>
                      {aiAnalysis.suggestedSecurity.toUpperCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">Security Level</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getRiskLevelColor(aiAnalysis.riskLevel)}`}>
                      {aiAnalysis.riskLevel}/100
                    </div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Capsule Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter capsule title..."
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your capsule content..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Enter your sensitive content here..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[150px] font-mono"
              required
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{formData.content.length} characters</span>
              {aiEnabled && formData.content && (
                <span className="flex items-center space-x-1">
                  <Brain className="h-3 w-3" />
                  <span>AI analysis {isAnalyzing ? 'running...' : 'ready'}</span>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      <AnimatePresence>
        {aiAnalysis && aiEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Content Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-500" />
                  <span>AI Analysis Results</span>
                  <Badge variant="outline">{aiAnalysis.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Suggested Security Level</span>
                      <Badge className={getSecurityLevelColor(aiAnalysis.suggestedSecurity)}>
                        {aiAnalysis.suggestedSecurity}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Contains PII</span>
                      {aiAnalysis.containsPII ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sentiment</span>
                      <Badge variant="outline">{aiAnalysis.sentiment}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm">Risk Assessment</span>
                      <div className="mt-1">
                        <Progress value={aiAnalysis.riskLevel} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Low</span>
                          <span className={getRiskLevelColor(aiAnalysis.riskLevel)}>
                            {aiAnalysis.riskLevel}/100
                          </span>
                          <span>High</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Suggested Tags */}
                {aiAnalysis.tags.length > 0 && (
                  <div className="space-y-2">
                    <Label>AI Suggested Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {aiAnalysis.tags.map((tag, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => applySuggestedTag(tag)}
                          className="h-7 text-xs"
                        >
                          <Lightbulb className="h-3 w-3 mr-1" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply All Suggestions */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyAISuggestions}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply All AI Suggestions
                </Button>
              </CardContent>
            </Card>

            {/* Duplicate Detection */}
            {duplicateMatches.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <Copy className="h-5 w-5" />
                    <span>Potential Duplicates Detected</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {duplicateMatches.slice(0, 3).map((match, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{match.similarity}% similar</strong> to existing capsule
                              <div className="text-xs text-muted-foreground mt-1">
                                Match type: {match.matchType} • "{match.matchedContent.substring(0, 50)}..."
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {match.matchType}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional Suggested Tags */}
      {suggestedTags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span>Smart Tag Suggestions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applySuggestedTag(tag)}
                  className="h-7 text-xs bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                >
                  + {tag}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags & Categorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="personal, important, documents..."
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Security Level</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'maximum'] as const).map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={formData.securityLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, securityLevel: level }))}
                  className={`capitalize ${getSecurityLevelColor(level)}`}
                >
                  {level}
                </Button>
              ))}
            </div>
            {aiAnalysis && formData.securityLevel === aiAnalysis.suggestedSecurity && (
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                <span>Matches AI recommendation</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-protection">Password Protection</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt capsule content with a password
              </p>
            </div>
            <Switch
              id="password-protection"
              checked={formData.enablePasswordProtection}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enablePasswordProtection: checked }))
              }
            />
          </div>

          {formData.enablePasswordProtection && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2 border-t pt-4"
            >
              <Label htmlFor="password">Encryption Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {aiAnalysis && aiAnalysis.riskLevel > 70 && (
                <div className="flex items-center space-x-1 text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span>AI recommends password protection for this content</span>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        size="lg" 
        disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Creating Capsule...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Create AI-Enhanced Capsule
          </>
        )}
      </Button>
    </form>
  )
}