// 📁 src/lib/ai-content-service.ts (NEW - AI Content Analysis)
export interface ContentAnalysis {
  category: string
  confidence: number
  tags: string[]
  suggestedSecurity: 'low' | 'medium' | 'high' | 'maximum'
  containsPII: boolean
  duplicateOf?: string
  sentiment?: 'positive' | 'neutral' | 'negative'
  summary?: string
  riskLevel: number // 0-100
}

export interface DuplicateMatch {
  capsuleId: string
  similarity: number
  matchType: 'exact' | 'near' | 'semantic'
  matchedContent: string
}

export interface SearchResult {
  capsuleId: string
  title: string
  relevanceScore: number
  matchedContent: string[]
  highlightedText: string
}

export class AIContentService {
  // Analyze text content for categorization and security
  static async analyzeTextContent(content: string): Promise<ContentAnalysis> {
    console.log('🤖 Analyzing text content...')
    
    // Simulate AI processing delay
    await this.delay(800)
    
    const analysis = this.performTextAnalysis(content)
    console.log('✅ Text analysis complete:', analysis)
    return analysis
  }

  // Analyze file metadata and extract text if possible
  static async analyzeFile(file: File): Promise<ContentAnalysis> {
    console.log('🤖 Analyzing file:', file.name)
    
    let textContent = ''
    
    // Extract text from different file types
    if (file.type.startsWith('text/')) {
      textContent = await this.extractTextFromFile(file)
    } else if (file.type === 'application/pdf') {
      textContent = await this.extractTextFromPDF(file)
    } else if (file.type.startsWith('image/')) {
      // Simulate OCR text extraction
      textContent = await this.performOCR(file)
    }
    
    // Analyze filename and content
    const filenameAnalysis = this.analyzeFilename(file.name)
    const contentAnalysis = textContent ? 
      this.performTextAnalysis(textContent) : 
      this.getDefaultFileAnalysis(file.type)
    
    return {
      ...contentAnalysis,
      tags: [...new Set([...filenameAnalysis.tags, ...contentAnalysis.tags])],
      category: filenameAnalysis.category || contentAnalysis.category,
      confidence: Math.min(filenameAnalysis.confidence + contentAnalysis.confidence, 100)
    }
  }

  // Smart search across capsule content
  static async intelligentSearch(
    query: string, 
    capsules: any[], 
    includeContent: boolean = true
  ): Promise<SearchResult[]> {
    console.log('🔍 Performing intelligent search for:', query)
    
    const results: SearchResult[] = []
    const queryTerms = this.tokenizeQuery(query)
    
    for (const capsule of capsules) {
      const relevanceScore = this.calculateRelevance(
        query, 
        queryTerms, 
        capsule, 
        includeContent
      )
      
      if (relevanceScore > 0.3) { // Threshold for relevance
        const matchedContent = this.extractMatchedContent(capsule, queryTerms)
        const highlightedText = this.highlightMatches(
          matchedContent.join(' '), 
          queryTerms
        )
        
        results.push({
          capsuleId: capsule.id,
          title: capsule.title,
          relevanceScore,
          matchedContent,
          highlightedText
        })
      }
    }
    
    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  // Detect duplicate content
  static async detectDuplicates(
    content: string, 
    existingCapsules: any[]
  ): Promise<DuplicateMatch[]> {
    console.log('🔍 Checking for duplicate content...')
    
    const matches: DuplicateMatch[] = []
    const contentFingerprint = this.createContentFingerprint(content)
    
    for (const capsule of existingCapsules) {
      const capsuleContent = this.extractTextFromCapsule(capsule)
      if (!capsuleContent) continue
      
      // Check for exact matches
      if (content.trim() === capsuleContent.trim()) {
        matches.push({
          capsuleId: capsule.id,
          similarity: 100,
          matchType: 'exact',
          matchedContent: content
        })
        continue
      }
      
      // Check for near matches (high similarity)
      const similarity = this.calculateTextSimilarity(content, capsuleContent)
      if (similarity > 85) {
        matches.push({
          capsuleId: capsule.id,
          similarity,
          matchType: 'near',
          matchedContent: this.findCommonSubstring(content, capsuleContent)
        })
      } else if (similarity > 60) {
        // Semantic similarity check
        const semanticSimilarity = this.calculateSemanticSimilarity(content, capsuleContent)
        if (semanticSimilarity > 70) {
          matches.push({
            capsuleId: capsule.id,
            similarity: semanticSimilarity,
            matchType: 'semantic',
            matchedContent: this.findCommonSubstring(content, capsuleContent)
          })
        }
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity)
  }

  // Auto-suggest tags based on content
  static async suggestTags(content: string, existingTags: string[]): Promise<string[]> {
    const analysis = this.performTextAnalysis(content)
    const suggestedTags = analysis.tags
    
    // Add contextual tags based on existing user tags
    const contextualTags = this.getContextualTags(content, existingTags)
    
    // Combine and deduplicate
    const allTags = [...new Set([...suggestedTags, ...contextualTags])]
    
    // Filter out existing tags and return top suggestions
    return allTags
      .filter(tag => !existingTags.includes(tag))
      .slice(0, 5)
  }

  // Generate smart summary of content
  static async generateSummary(content: string, maxLength: number = 150): Promise<string> {
    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
    
    if (sentences.length <= 2) {
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
    }
    
    // Score sentences by importance
    const scoredSentences = sentences.map(sentence => ({
      text: sentence.trim(),
      score: this.calculateSentenceImportance(sentence, content)
    }))
    
    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => content.indexOf(a.text) - content.indexOf(b.text))
    
    const summary = topSentences.map(s => s.text).join('. ')
    return summary.length > maxLength ? 
      summary.substring(0, maxLength) + '...' : summary
  }

  // Private helper methods
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private static performTextAnalysis(content: string): ContentAnalysis {
    const text = content.toLowerCase()
    
    // Category detection
    let category = 'General'
    let suggestedSecurity: 'low' | 'medium' | 'high' | 'maximum' = 'medium'
    let containsPII = false
    let riskLevel = 30
    
    // Financial content
    if (this.matchesPattern(text, [
      'bank', 'account', 'credit card', 'ssn', 'social security',
      'routing number', 'iban', 'bitcoin', 'wallet', 'investment'
    ])) {
      category = 'Financial'
      suggestedSecurity = 'maximum'
      containsPII = true
      riskLevel = 90
    }
    // Medical content
    else if (this.matchesPattern(text, [
      'medical', 'health', 'doctor', 'prescription', 'diagnosis',
      'insurance', 'patient', 'treatment', 'medication'
    ])) {
      category = 'Medical'
      suggestedSecurity = 'high'
      containsPII = true
      riskLevel = 80
    }
    // Legal content
    else if (this.matchesPattern(text, [
      'legal', 'contract', 'agreement', 'lawsuit', 'will',
      'testament', 'deed', 'license', 'copyright', 'patent'
    ])) {
      category = 'Legal'
      suggestedSecurity = 'high'
      riskLevel = 75
    }
    // Personal documents
    else if (this.matchesPattern(text, [
      'passport', 'driver', 'license', 'birth certificate',
      'marriage', 'divorce', 'diploma', 'degree'
    ])) {
      category = 'Documents'
      suggestedSecurity = 'high'
      containsPII = true
      riskLevel = 85
    }
    // Work/Business
    else if (this.matchesPattern(text, [
      'work', 'business', 'company', 'meeting', 'project',
      'client', 'proposal', 'budget', 'salary', 'contract'
    ])) {
      category = 'Work'
      suggestedSecurity = 'medium'
      riskLevel = 50
    }
    // Personal/Family
    else if (this.matchesPattern(text, [
      'family', 'personal', 'diary', 'journal', 'photo',
      'memory', 'birthday', 'anniversary', 'vacation'
    ])) {
      category = 'Personal'
      suggestedSecurity = 'medium'
      riskLevel = 40
    }
    
    // Generate tags
    const tags = this.extractTags(text, category)
    
    // Detect PII patterns
    if (this.detectPII(content)) {
      containsPII = true
      riskLevel = Math.max(riskLevel, 70)
      suggestedSecurity = suggestedSecurity === 'low' ? 'medium' : suggestedSecurity
    }
    
    return {
      category,
      confidence: 85,
      tags,
      suggestedSecurity,
      containsPII,
      riskLevel,
      sentiment: this.analyzeSentiment(text)
    }
  }

  private static matchesPattern(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private static extractTags(text: string, category: string): string[] {
    const tags: string[] = [category.toLowerCase()]
    
    // Common important terms
    const importantTerms = [
      'important', 'urgent', 'confidential', 'private', 'secret',
      'backup', 'copy', 'original', 'signed', 'certified'
    ]
    
    importantTerms.forEach(term => {
      if (text.includes(term)) {
        tags.push(term)
      }
    })
    
    // Extract potential custom tags (capitalized words)
    const words = text.match(/\b[A-Z][a-z]+\b/g) || []
    const customTags = words
      .filter(word => word.length > 3 && word.length < 15)
      .slice(0, 3)
      .map(word => word.toLowerCase())
    
    tags.push(...customTags)
    
    return [...new Set(tags)]
  }

  private static detectPII(content: string): boolean {
    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    // Phone pattern
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/
    // SSN pattern
    const ssnPattern = /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/
    // Credit card pattern (basic)
    const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/
    
    return emailPattern.test(content) || 
           phonePattern.test(content) || 
           ssnPattern.test(content) || 
           ccPattern.test(content)
  }

  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'success', 'achievement']
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'failure', 'problem', 'issue', 'error']
    
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0)
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (text.split(word).length - 1), 0)
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private static analyzeFilename(filename: string): Partial<ContentAnalysis> {
    const name = filename.toLowerCase()
    const tags: string[] = []
    let category = 'Documents'
    let confidence = 60
    
    if (name.includes('photo') || name.includes('img') || name.includes('pic')) {
      category = 'Personal'
      tags.push('photo', 'image')
    } else if (name.includes('doc') || name.includes('pdf') || name.includes('document')) {
      category = 'Documents'
      tags.push('document')
    } else if (name.includes('video') || name.includes('mov') || name.includes('mp4')) {
      category = 'Personal'
      tags.push('video', 'media')
    }
    
    // Extract date from filename
    const dateMatch = name.match(/(\d{4})[_-]?(\d{2})[_-]?(\d{2})/)
    if (dateMatch) {
      tags.push('dated', dateMatch[1])
      confidence += 20
    }
    
    return { category, tags, confidence }
  }

  private static getDefaultFileAnalysis(fileType: string): ContentAnalysis {
    let category = 'Documents'
    const tags: string[] = []
    
    if (fileType.startsWith('image/')) {
      category = 'Personal'
      tags.push('image', 'photo')
    } else if (fileType.startsWith('video/')) {
      category = 'Personal'
      tags.push('video', 'media')
    } else if (fileType.startsWith('audio/')) {
      category = 'Personal'
      tags.push('audio', 'voice')
    } else if (fileType === 'application/pdf') {
      category = 'Documents'
      tags.push('pdf', 'document')
    }
    
    return {
      category,
      confidence: 50,
      tags,
      suggestedSecurity: 'medium',
      containsPII: false,
      riskLevel: 30
    }
  }

  // File content extraction methods (simplified)
  private static async extractTextFromFile(file: File): Promise<string> {
    try {
      return await file.text()
    } catch {
      return ''
    }
  }

  private static async extractTextFromPDF(file: File): Promise<string> {
    // In a real app, you'd use a PDF parser like pdf-parse
    // For now, return filename-based analysis
    return `PDF document: ${file.name}`
  }

  private static async performOCR(file: File): Promise<string> {
    // In a real app, you'd use an OCR service like Tesseract.js
    // For now, return filename-based analysis
    return `Image file: ${file.name}`
  }

  // Search helper methods
  private static tokenizeQuery(query: string): string[] {
    return query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
  }

  private static calculateRelevance(
    query: string, 
    queryTerms: string[], 
    capsule: any, 
    includeContent: boolean
  ): number {
    let score = 0
    const title = capsule.title.toLowerCase()
    const description = (capsule.description || '').toLowerCase()
    
    // Title matches (highest weight)
    if (title.includes(query.toLowerCase())) score += 50
    queryTerms.forEach(term => {
      if (title.includes(term)) score += 20
    })
    
    // Description matches
    if (description.includes(query.toLowerCase())) score += 30
    queryTerms.forEach(term => {
      if (description.includes(term)) score += 10
    })
    
    // Tag matches
    const tags = capsule.metadata?.tags || []
    tags.forEach((tag: string) => {
      if (tag.toLowerCase().includes(query.toLowerCase())) score += 25
      queryTerms.forEach(term => {
        if (tag.toLowerCase().includes(term)) score += 15
      })
    })
    
    // Content matches (if enabled and available)
    if (includeContent && capsule.content) {
      const contentText = this.extractTextFromCapsule(capsule)
      if (contentText) {
        if (contentText.includes(query.toLowerCase())) score += 20
        queryTerms.forEach(term => {
          const termCount = (contentText.match(new RegExp(term, 'gi')) || []).length
          score += termCount * 5
        })
      }
    }
    
    return Math.min(score, 100) / 100 // Normalize to 0-1
  }

  private static extractMatchedContent(capsule: any, queryTerms: string[]): string[] {
    const matches: string[] = []
    
    if (queryTerms.some(term => capsule.title.toLowerCase().includes(term))) {
      matches.push(capsule.title)
    }
    
    if (capsule.description && queryTerms.some(term => 
      capsule.description.toLowerCase().includes(term)
    )) {
      matches.push(capsule.description)
    }
    
    const tags = capsule.metadata?.tags || []
    const matchedTags = tags.filter((tag: string) => 
      queryTerms.some(term => tag.toLowerCase().includes(term))
    )
    matches.push(...matchedTags)
    
    return matches
  }

  private static highlightMatches(text: string, queryTerms: string[]): string {
    let highlighted = text
    queryTerms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })
    return highlighted
  }

  private static extractTextFromCapsule(capsule: any): string {
    if (!capsule.content) return ''
    
    let text = ''
    if (capsule.content.text) text += capsule.content.text + ' '
    if (capsule.title) text += capsule.title + ' '
    if (capsule.description) text += capsule.description + ' '
    
    return text.toLowerCase()
  }

  // Similarity calculation methods
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(word => words2.has(word)))
    const union = new Set([...words1, ...words2])
    
    return (intersection.size / union.size) * 100
  }

  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified semantic similarity using common phrases
    const phrases1 = this.extractPhrases(text1)
    const phrases2 = this.extractPhrases(text2)
    
    const commonPhrases = phrases1.filter(phrase => phrases2.includes(phrase))
    const totalPhrases = new Set([...phrases1, ...phrases2]).size
    
    return (commonPhrases.length / totalPhrases) * 100
  }

  private static extractPhrases(text: string): string[] {
    // Extract 2-3 word phrases
    const words = text.toLowerCase().split(/\s+/)
    const phrases: string[] = []
    
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`)
      if (i < words.length - 2) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
      }
    }
    
    return phrases
  }

  private static findCommonSubstring(text1: string, text2: string): string {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)
    
    let longestCommon = ''
    
    for (let i = 0; i < words1.length; i++) {
      for (let j = 0; j < words2.length; j++) {
        let k = 0
        while (
          i + k < words1.length && 
          j + k < words2.length && 
          words1[i + k].toLowerCase() === words2[j + k].toLowerCase()
        ) {
          k++
        }
        
        if (k > 0) {
          const common = words1.slice(i, i + k).join(' ')
          if (common.length > longestCommon.length) {
            longestCommon = common
          }
        }
      }
    }
    
    return longestCommon || text1.substring(0, 50) + '...'
  }

  private static createContentFingerprint(content: string): string {
    // Simple content fingerprinting
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20)
    
    return words.sort().join('|')
  }

  private static getContextualTags(content: string, existingTags: string[]): string[] {
    const contextualTags: string[] = []
    
    // If user has financial tags, suggest related financial terms
    if (existingTags.some(tag => ['bank', 'finance', 'money'].includes(tag))) {
      if (content.toLowerCase().includes('account')) contextualTags.push('account')
      if (content.toLowerCase().includes('investment')) contextualTags.push('investment')
    }
    
    // If user has work tags, suggest work-related terms
    if (existingTags.some(tag => ['work', 'business', 'job'].includes(tag))) {
      if (content.toLowerCase().includes('meeting')) contextualTags.push('meeting')
      if (content.toLowerCase().includes('project')) contextualTags.push('project')
    }
    
    return contextualTags
  }

  private static calculateSentenceImportance(sentence: string, fullText: string): number {
    let score = 0
    
    // Longer sentences get higher scores
    score += sentence.length / 100
    
    // Sentences with numbers or dates are often important
    if (/\d/.test(sentence)) score += 0.3
    
    // Sentences with proper nouns
    if (/[A-Z][a-z]+/.test(sentence)) score += 0.2
    
    // First and last sentences are often important
    const sentences = fullText.split(/[.!?]+/)
    const index = sentences.indexOf(sentence)
    if (index === 0 || index === sentences.length - 1) score += 0.4
    
    return score
  }
}