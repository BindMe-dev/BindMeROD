"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, History } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AgreementVersion {
  id: string
  version: number
  title: string
  description: string
  keyTerms: string
  createdAt: Date
  createdBy: string
  changeReason?: string
}

interface DiffChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  field: string
  oldValue?: string
  newValue?: string
}

interface AgreementDiffViewerProps {
  agreementId: string
}

export function AgreementDiffViewer({ agreementId }: AgreementDiffViewerProps) {
  const [versions, setVersions] = useState<AgreementVersion[]>([])
  const [selectedVersion1, setSelectedVersion1] = useState<string>("")
  const [selectedVersion2, setSelectedVersion2] = useState<string>("")
  const [diff, setDiff] = useState<DiffChange[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  useEffect(() => {
    fetchVersions()
  }, [agreementId])

  useEffect(() => {
    if (selectedVersion1 && selectedVersion2) {
      fetchDiff()
    }
  }, [selectedVersion1, selectedVersion2])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/agreements/${agreementId}/versions`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
        
        // Auto-select latest two versions
        if (data.versions.length >= 2) {
          setSelectedVersion1(data.versions[data.versions.length - 2].id)
          setSelectedVersion2(data.versions[data.versions.length - 1].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error)
    }
  }

  const fetchDiff = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/agreements/${agreementId}/versions/diff?v1=${selectedVersion1}&v2=${selectedVersion2}`
      )
      if (response.ok) {
        const data = await response.json()
        setDiff(data.changes || [])
      }
    } catch (error) {
      console.error("Failed to fetch diff:", error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeColor = (type: DiffChange['type']) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 dark:bg-green-900/20 border-green-500'
      case 'removed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-500'
      case 'modified':
        return 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500'
      default:
        return 'bg-muted border-muted'
    }
  }

  const getChangeIcon = (type: DiffChange['type']) => {
    switch (type) {
      case 'added':
        return '+'
      case 'removed':
        return '-'
      case 'modified':
        return '~'
      default:
        return '='
    }
  }

  const renderSideBySide = () => {
    const version1 = versions.find(v => v.id === selectedVersion1)
    const version2 = versions.find(v => v.id === selectedVersion2)

    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Left side - Version 1 */}
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="font-semibold">Version {version1?.version}</h3>
            <p className="text-sm text-muted-foreground">
              {version1?.createdAt ? new Date(version1.createdAt).toLocaleString() : ''}
            </p>
          </div>

          <ScrollArea className="h-[500px]">
            {diff.map((change, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded border-l-4 ${getChangeColor(change.type)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {change.field}
                  </Badge>
                  <span className="text-xs font-mono">{getChangeIcon(change.type)}</span>
                </div>
                
                {change.oldValue && (
                  <div className="text-sm">
                    <span className="font-semibold">Old: </span>
                    {change.type === 'removed' && (
                      <span className="line-through text-muted-foreground">
                        {change.oldValue}
                      </span>
                    )}
                    {change.type !== 'removed' && change.oldValue}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Right side - Version 2 */}
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <h3 className="font-semibold">Version {version2?.version}</h3>
            <p className="text-sm text-muted-foreground">
              {version2?.createdAt ? new Date(version2.createdAt).toLocaleString() : ''}
            </p>
          </div>

          <ScrollArea className="h-[500px]">
            {diff.map((change, index) => (
              <div
                key={index}
                className={`mb-3 p-3 rounded border-l-4 ${getChangeColor(change.type)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {change.field}
                  </Badge>
                  <span className="text-xs font-mono">{getChangeIcon(change.type)}</span>
                </div>
                
                {change.newValue && (
                  <div className="text-sm">
                    <span className="font-semibold">New: </span>
                    {change.type === 'added' && (
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {change.newValue}
                      </span>
                    )}
                    {change.type !== 'added' && change.newValue}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    )
  }

  const renderUnified = () => {
    return (
      <div className="border rounded-lg p-4">
        <ScrollArea className="h-[500px]">
          {diff.map((change, index) => (
            <div
              key={index}
              className={`mb-4 p-4 rounded border-l-4 ${getChangeColor(change.type)}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-mono">{getChangeIcon(change.type)}</span>
                <Badge variant="outline">{change.field}</Badge>
                <Badge
                  variant={
                    change.type === 'added'
                      ? 'default'
                      : change.type === 'removed'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {change.type}
                </Badge>
              </div>

              <div className="space-y-2">
                {change.oldValue && (
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Removed:</p>
                    <p className="text-sm line-through">{change.oldValue}</p>
                  </div>
                )}

                {change.newValue && (
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
                    <p className="text-xs text-muted-foreground mb-1">Added:</p>
                    <p className="text-sm">{change.newValue}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <History className="h-6 w-6" />
          Version Comparison
        </h2>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
            onClick={() => setViewMode('side-by-side')}
            size="sm"
          >
            Side by Side
          </Button>
          <Button
            variant={viewMode === 'unified' ? 'default' : 'outline'}
            onClick={() => setViewMode('unified')}
            size="sm"
          >
            Unified
          </Button>
        </div>
      </div>

      {/* Version selectors */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Base Version</label>
          <Select value={selectedVersion1} onValueChange={setSelectedVersion1}>
            <SelectTrigger>
              <SelectValue placeholder="Select base version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  Version {version.version} ({new Date(version.createdAt).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ChevronRight className="h-6 w-6 mt-6" />

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Compare To</label>
          <Select value={selectedVersion2} onValueChange={setSelectedVersion2}>
            <SelectTrigger>
              <SelectValue placeholder="Select version to compare" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((version) => (
                <SelectItem key={version.id} value={version.id}>
                  Version {version.version} ({new Date(version.createdAt).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      {diff.length > 0 && (
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Changes:</span>
            <Badge variant="default">{diff.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Added:</span>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
              {diff.filter(d => d.type === 'added').length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Removed:</span>
            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/20">
              {diff.filter(d => d.type === 'removed').length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Modified:</span>
            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/20">
              {diff.filter(d => d.type === 'modified').length}
            </Badge>
          </div>
        </div>
      )}

      {/* Diff view */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      ) : diff.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            Select two versions to compare
          </p>
        </div>
      ) : viewMode === 'side-by-side' ? (
        renderSideBySide()
      ) : (
        renderUnified()
      )}
    </div>
  )
}
