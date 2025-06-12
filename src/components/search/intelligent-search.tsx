// 📁 src/components/search/intelligent-search.tsx (NEW - AI-Powered Search)
'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Brain, 
  Filter, 
  SortAsc, 
  Clock, 
  Star,
  Zap,
  Target,
  ChevronDown,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { motion, AnimatePresence } from 'framer-motion'
import { AIContentService, SearchResult } from '@/lib/ai-content-service'
import { useCapsuleStore } from '@/store/capsules'
import { toast } from 'sonner'

interface IntelligentSearchProps {
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  showFilters?: boolean
}

export function IntelligentSearch({ 
  onResultSelect, 
  placeholder = "Search your capsules intelligently...",
  showFilters = true 
}: IntelligentSearchProps) {
  const { capsules } = useCapsuleStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    security: '',
    dateRange: '',
    includeContent: true
  })
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance')
  const [searchProgress, setSearchProgress] = useState(0)
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search-history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (error) {
        console.warn('Failed to load search history')
      }
    }
  }, [])

  // Auto-search with debouncing
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      performSearch()
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, filters, sortBy])

  const performSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => Math.min(prev + 20, 90))
      }, 100)

      // Filter capsules based on filters
      let filteredCapsules = capsules
      
      if (filters.category) {
        filteredCapsules = filteredCapsules.filter(c => 
          c.metadata.category.toLowerCase() === filters.category.toLowerCase()
        )
      }
      
      if (filters.security) {
        filteredCapsules = filteredCapsules.filter(c => 
          c.metadata.securityLevel === filters.security
        )
      }

      if (filters.dateRange) {
        const now = new Date()
        const cutoff = new Date()
        
        switch (filters.dateRange) {
          case 'week':
            cutoff.setDate(now.getDate() - 7)
            break
          case 'month':
            cutoff.setMonth(now.getMonth() - 1)
            break
          case 'year':
            cutoff.setFullYear(now.getFullYear() - 1)
            break
        }
        
        filteredCapsules = filteredCapsules.filter(c => 
          new Date(c.updatedAt) >= cutoff
        )
      }

      // Perform AI-powered search
      const searchResults = await AIContentService.intelligentSearch(
        query, 
        filteredCapsules, 
        filters.includeContent
      )

      // Sort results
      const sortedResults = sortResults(searchResults, sortBy)
      
      clearInterval(progressInterval)
      setSearchProgress(100)
      setResults(sortedResults)

      // Add to search history
      addToSearchHistory(query)

      if (sortedResults.length === 0) {
        toast.info('No matches found. Try different keywords or adjust filters.')
      } else {
        toast.success(`Found ${sortedResults.length} relevant result${sortedResults.length > 1 ? 's' : ''}`)
      }

    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed. Please try again.')
      setResults([])
    } finally {
      setIsSearching(false)
      setTimeout(() => setSearchProgress(0), 2000)
    }
  }

  const sortResults = (results: SearchResult[], sortBy: string): SearchResult[] => {
    switch (sortBy) {
      case 'date':
        return [...results].sort((a, b) => {
          const capsuleA = capsules.find(c => c.id === a.capsuleId)
          const capsuleB = capsules.find(c => c.id === b.capsuleId)
          return new Date(capsuleB?.updatedAt || 0).getTime() - new Date(capsuleA?.updatedAt || 0).getTime()
        })
      case 'title':
        return [...results].sort((a, b) => a.title.localeCompare(b.title))
      case 'relevance':
      default:
        return results // Already sorted by relevance
    }
  }

  const addToSearchHistory = (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed || searchHistory.includes(trimmed)) return

    const newHistory = [trimmed, ...searchHistory.slice(0, 9)] // Keep last 10 searches
    setSearchHistory(newHistory)
    localStorage.setItem('search-history', JSON.stringify(newHistory))
  }

  const handleSearchSelect = (selectedQuery: string) => {
    setQuery(selectedQuery)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('search-history')
    toast.success('Search history cleared')
  }

  const getRelevanceColor = (score: number) => {
    if (score > 0.8) return 'text-green-500'
    if (score > 0.6) return 'text-yellow-500'
    if (score > 0.4) return 'text-orange-500'
    return 'text-red-500'
  }

  const getRelevanceLabel = (score: number) => {
    if (score > 0.8) return 'Excellent Match'
    if (score > 0.6) return 'Good Match'
    if (score > 0.4) return 'Fair Match'
    return 'Weak Match'
  }

  // Get unique categories and security levels for filters
  const categories = [...new Set(capsules.map(c => c.metadata.category))]
  const securityLevels = [...new Set(capsules.map(c => c.metadata.securityLevel))]

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {query && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Brain className={`h-4 w-4 ${isSearching ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
          </div>
        </div>

        {/* Search Progress */}
        {isSearching && searchProgress > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1">
            <Progress value={searchProgress} className="h-1" />
          </div>
        )}

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && (query.length === 0 || searchHistory.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <Card className="shadow-lg">
                <CardContent className="p-3">
                  {query.length === 0 && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Recent Searches
                      </div>
                      {searchHistory.length > 0 ? (
                        <div className="space-y-1">
                          {searchHistory.slice(0, 5).map((historyItem, index) => (
                            <button
                              key={index}
                              onClick={() => handleSearchSelect(historyItem)}
                              className="w-full text-left p-2 hover:bg-muted rounded text-sm flex items-center space-x-2"
                            >
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{historyItem}</span>
                            </button>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSearchHistory}
                            className="w-full text-xs mt-2"
                          >
                            Clear History
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-2">
                          No recent searches
                        </div>
                      )}
                    </>
                  )}

                  {/* Quick Search Suggestions */}
                  <div className="mt-3 border-t pt-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      Quick Searches
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['important', 'recent', 'documents', 'personal', 'work'].map((suggestion) => (
                        <Button
                          key={suggestion}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSearchSelect(suggestion)}
                          className="h-6 text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters and Sort */}
      {showFilters && (
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Category
                {filters.category && <Badge variant="secondary" className="ml-2">{filters.category}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, category: '' }))}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setFilters(prev => ({ ...prev, category }))}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Security Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Security
                {filters.security && <Badge variant="secondary" className="ml-2">{filters.security}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Security Level</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, security: '' }))}>
                All Levels
              </DropdownMenuItem>
              {securityLevels.map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setFilters(prev => ({ ...prev, security: level }))}
                >
                  {level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Date Range
                {filters.dateRange && <Badge variant="secondary" className="ml-2">{filters.dateRange}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Date</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: '' }))}>
                All Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'week' }))}>
                Last Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'month' }))}>
                Last Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, dateRange: 'year' }))}>
                Last Year
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SortAsc className="h-4 w-4 mr-2" />
                Sort: {sortBy}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSortBy('relevance')}>
                <Target className="h-4 w-4 mr-2" />
                Relevance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                <Clock className="h-4 w-4 mr-2" />
                Date Modified
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('title')}>
                <Star className="h-4 w-4 mr-2" />
                Title
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Content Search Toggle */}
          <Button
            variant={filters.includeContent ? "default" : "outline"}
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, includeContent: !prev.includeContent }))}
          >
            <Zap className="h-4 w-4 mr-2" />
            Deep Search
          </Button>
        </div>
      )}

      {/* Search Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Found {results.length} result{results.length > 1 ? 's' : ''} 
                {query && ` for "${query}"`}
              </h3>
              <Badge variant="outline" className="text-xs">
                AI-Powered
              </Badge>
            </div>

            <div className="space-y-2">
              {results.map((result, index) => (
                <motion.div
                  key={result.capsuleId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={() => onResultSelect?.(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{result.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getRelevanceColor(result.relevanceScore)}`}
                            >
                              {Math.round(result.relevanceScore * 100)}% match
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            {result.matchedContent.slice(0, 2).map((content, idx) => (
                              <div key={idx} className="text-sm text-muted-foreground">
                                {content.length > 100 ? `${content.substring(0, 100)}...` : content}
                              </div>
                            ))}
                          </div>

                          {result.highlightedText && (
                            <div 
                              className="text-sm mt-2 p-2 bg-muted/50 rounded"
                              dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                            />
                          )}
                        </div>

                        <div className="text-right">
                          <div className={`text-xs font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                            {getRelevanceLabel(result.relevanceScore)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.matchedContent.length} match{result.matchedContent.length > 1 ? 'es' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {query && !isSearching && results.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Results Found</h3>
          <p className="text-muted-foreground mb-4">
            Try different keywords or adjust your filters
          </p>
          <div className="flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({
                category: '',
                security: '',
                dateRange: '',
                includeContent: true
              })}
            >
              Clear Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters(prev => ({ ...prev, includeContent: !prev.includeContent }))}
            >
              {filters.includeContent ? 'Search Titles Only' : 'Include Content'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}