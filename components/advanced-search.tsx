"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Search, 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  RotateCcw
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Agreement, AgreementCategory, AgreementType, AgreementStatus } from "@/lib/agreement-types"
import { CATEGORIES } from "@/lib/categories"

interface SearchFilters {
  query: string
  category: AgreementCategory | "all"
  type: AgreementType | "all"
  status: AgreementStatus | "all"
  dateRange: {
    from: Date | null
    to: Date | null
  }
  tags: string[]
  isShared: boolean | null
  isPublic: boolean | null
  hasDeadline: boolean | null
  priority: string | "all"
  sortBy: "created" | "updated" | "deadline" | "title"
  sortOrder: "asc" | "desc"
}

interface AdvancedSearchProps {
  agreements: Agreement[]
  onFilteredResults: (filtered: Agreement[]) => void
  className?: string
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  category: "all",
  type: "all",
  status: "all",
  dateRange: { from: null, to: null },
  tags: [],
  isShared: null,
  isPublic: null,
  hasDeadline: null,
  priority: "all",
  sortBy: "created",
  sortOrder: "desc"
}

export function AdvancedSearch({ agreements, onFilteredResults, className }: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; filters: SearchFilters }>>([])

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('bindme_saved_searches')
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load saved searches:', error)
      }
    }
  }, [])

  // Load filters from URL params
  useEffect(() => {
    const urlFilters = { ...DEFAULT_FILTERS }
    
    if (searchParams.get('q')) urlFilters.query = searchParams.get('q')!
    if (searchParams.get('category')) urlFilters.category = searchParams.get('category') as AgreementCategory
    if (searchParams.get('type')) urlFilters.type = searchParams.get('type') as AgreementType
    if (searchParams.get('status')) urlFilters.status = searchParams.get('status') as AgreementStatus
    if (searchParams.get('sort')) urlFilters.sortBy = searchParams.get('sort') as any
    if (searchParams.get('order')) urlFilters.sortOrder = searchParams.get('order') as any
    
    setFilters(urlFilters)
  }, [searchParams])

  // Get all unique tags from agreements
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    agreements.forEach(agreement => {
      agreement.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [agreements])

  // Filter and sort agreements
  const filteredAgreements = useMemo(() => {
    let filtered = agreements.filter(agreement => {
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase()
        const searchableText = [
          agreement.title,
          agreement.description,
          ...(agreement.tags || []),
          agreement.category,
          agreement.type,
          agreement.status
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(query)) return false
      }

      // Category filter
      if (filters.category !== "all" && agreement.category !== filters.category) {
        return false
      }

      // Type filter
      if (filters.type !== "all" && agreement.type !== filters.type) {
        return false
      }

      // Status filter
      if (filters.status !== "all" && agreement.status !== filters.status) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const createdDate = new Date(agreement.createdAt)
        if (filters.dateRange.from && createdDate < filters.dateRange.from) return false
        if (filters.dateRange.to && createdDate > filters.dateRange.to) return false
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const agreementTags = agreement.tags || []
        if (!filters.tags.some(tag => agreementTags.includes(tag))) return false
      }

      // Boolean filters
      if (filters.isShared !== null && agreement.isShared !== filters.isShared) return false
      if (filters.isPublic !== null && agreement.isPublic !== filters.isPublic) return false
      if (filters.hasDeadline !== null) {
        const hasDeadline = !!agreement.deadline
        if (hasDeadline !== filters.hasDeadline) return false
      }

      // Priority filter
      if (filters.priority !== "all" && agreement.priority !== filters.priority) {
        return false
      }

      return true
    })

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case "title":
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case "updated":
          aValue = new Date(a.updatedAt || a.createdAt)
          bValue = new Date(b.updatedAt || b.createdAt)
          break
        case "deadline":
          aValue = a.deadline ? new Date(a.deadline) : new Date(0)
          bValue = b.deadline ? new Date(b.deadline) : new Date(0)
          break
        default: // created
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [agreements, filters])

  // Update filtered results
  useEffect(() => {
    onFilteredResults(filteredAgreements)
  }, [filteredAgreements, onFilteredResults])

  // Update URL with current filters
  const updateURL = (newFilters: SearchFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.query) params.set('q', newFilters.query)
    if (newFilters.category !== "all") params.set('category', newFilters.category)
    if (newFilters.type !== "all") params.set('type', newFilters.type)
    if (newFilters.status !== "all") params.set('status', newFilters.status)
    if (newFilters.sortBy !== "created") params.set('sort', newFilters.sortBy)
    if (newFilters.sortOrder !== "desc") params.set('order', newFilters.sortOrder)
    
    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/dashboard${newURL}`, { scroll: false })
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateURL(newFilters)
  }

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS)
    updateURL(DEFAULT_FILTERS)
  }

  const saveSearch = () => {
    const name = prompt("Enter a name for this search:")
    if (name && name.trim()) {
      const newSavedSearches = [...savedSearches, { name: name.trim(), filters }]
      setSavedSearches(newSavedSearches)
      localStorage.setItem('bindme_saved_searches', JSON.stringify(newSavedSearches))
    }
  }

  const loadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters)
    updateURL(savedFilters)
  }

  const deleteSavedSearch = (index: number) => {
    const newSavedSearches = savedSearches.filter((_, i) => i !== index)
    setSavedSearches(newSavedSearches)
    localStorage.setItem('bindme_saved_searches', JSON.stringify(newSavedSearches))
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.category !== "all") count++
    if (filters.type !== "all") count++
    if (filters.status !== "all") count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.tags.length > 0) count++
    if (filters.isShared !== null) count++
    if (filters.isPublic !== null) count++
    if (filters.hasDeadline !== null) count++
    if (filters.priority !== "all") count++
    return count
  }, [filters])

  return (
    <Card className={`bg-slate-900/50 border-slate-800 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="w-5 h-5" />
            Advanced Search
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300"
            >
              <Filter className="w-4 h-4" />
              {isExpanded ? "Simple" : "Advanced"}
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-slate-300"
              >
                <RotateCcw className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Search */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search agreements..."
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => handleFilterChange("sortOrder", value)}
          >
            <SelectTrigger className="w-20 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">↓</SelectItem>
              <SelectItem value="asc">↑</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange("category", value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange("type", value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="one-time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="bet">Bet/Wager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-slate-300">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-slate-300">Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-slate-800 border-slate-700",
                        !filters.dateRange.from && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from || undefined}
                      onSelect={(date) => handleFilterChange("dateRange", { ...filters.dateRange, from: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal bg-slate-800 border-slate-700",
                        !filters.dateRange.to && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to || undefined}
                      onSelect={(date) => handleFilterChange("dateRange", { ...filters.dateRange, to: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                <Label className="text-slate-300">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer",
                        filters.tags.includes(tag)
                          ? "bg-blue-500 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      )}
                      onClick={() => {
                        const newTags = filters.tags.includes(tag)
                          ? filters.tags.filter(t => t !== tag)
                          : [...filters.tags, tag]
                        handleFilterChange("tags", newTags)
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Boolean Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared"
                  checked={filters.isShared === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange("isShared", checked ? true : null)
                  }
                />
                <Label htmlFor="shared" className="text-slate-300">Shared agreements</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public"
                  checked={filters.isPublic === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange("isPublic", checked ? true : null)
                  }
                />
                <Label htmlFor="public" className="text-slate-300">Public agreements</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deadline"
                  checked={filters.hasDeadline === true}
                  onCheckedChange={(checked) => 
                    handleFilterChange("hasDeadline", checked ? true : null)
                  }
                />
                <Label htmlFor="deadline" className="text-slate-300">Has deadline</Label>
              </div>
            </div>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <Label className="text-slate-300">Saved Searches</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedSearches.map((saved, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="cursor-pointer bg-slate-800 text-slate-300 hover:bg-slate-700"
                        onClick={() => loadSavedSearch(saved.filters)}
                      >
                        {saved.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
                        onClick={() => deleteSavedSearch(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                size="sm"
                onClick={saveSearch}
                className="bg-slate-800 border-slate-700 text-slate-300"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
              <div className="text-sm text-slate-400">
                {filteredAgreements.length} of {agreements.length} agreements
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}