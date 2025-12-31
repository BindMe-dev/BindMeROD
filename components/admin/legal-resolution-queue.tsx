"use client"

/**
 * Legal Resolution Queue Component
 * 
 * WHY: This is the CORE of the law firm integration. When agreements escalate to legal
 * resolution, admins need to quickly assign them to appropriate law firms.
 * 
 * BUSINESS VALUE:
 * - Fast case assignment = better user experience = higher retention
 * - Smart matching = higher success rate = better reputation
 * - Visibility into pipeline = revenue forecasting
 * 
 * USER JOURNEY CONNECTION:
 * User Agreement Disputed → Friendly Resolution Fails → Enters This Queue → 
 * Admin Assigns to Law Firm → Law Firm Accepts → User Gets Help
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Scale,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

interface AgreementInQueue {
  id: string
  title: string
  type: string
  value: number // £
  status: 'disputed' | 'escalated' | 'pending_legal'
  createdAt: string
  disputedAt: string
  creatorEmail: string
  counterpartyEmail: string
  daysInQueue: number
  priority: 'urgent' | 'high' | 'medium' | 'low'
  suggestedFirms: Array<{
    firmId: string
    firmName: string
    matchScore: number // 0-100
    reason: string
  }>
}

interface LegalResolutionQueueProps {
  agreements: AgreementInQueue[]
  onAssign: (agreementId: string, firmId: string) => void
  onViewDetails: (agreementId: string) => void
}

export function LegalResolutionQueue({ agreements, onAssign, onViewDetails }: LegalResolutionQueueProps) {
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null)
  const [selectedFirm, setSelectedFirm] = useState<string>('')

  const priorityColors = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const totalValue = agreements.reduce((sum, a) => sum + a.value, 0)
  const avgDaysInQueue = agreements.length > 0
    ? agreements.reduce((sum, a) => sum + a.daysInQueue, 0) / agreements.length
    : 0

  return (
    <Card className="bg-slate-900/80 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-400" />
            Legal Resolution Queue
          </CardTitle>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
            {agreements.length} Cases
          </Badge>
        </div>
        
        {/* Queue Metrics */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-1 text-yellow-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs text-slate-400">Total Value</span>
            </div>
            <p className="text-lg font-bold text-white">£{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-1 text-orange-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs text-slate-400">Avg Wait</span>
            </div>
            <p className="text-lg font-bold text-white">{avgDaysInQueue.toFixed(1)} days</p>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-1 text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs text-slate-400">Urgent</span>
            </div>
            <p className="text-lg font-bold text-white">
              {agreements.filter(a => a.priority === 'urgent').length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {agreements.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No agreements pending legal assignment</p>
            <p className="text-sm mt-1">Cases will appear here when users request legal help</p>
          </div>
        ) : (
          agreements.map((agreement) => (
            <div
              key={agreement.id}
              className="bg-slate-800/60 rounded-lg p-4 hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{agreement.title}</h4>
                    <Badge className={`${priorityColors[agreement.priority]} border text-xs`}>
                      {agreement.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {agreement.type} • £{agreement.value.toLocaleString()} • {agreement.daysInQueue} days in queue
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {agreement.creatorEmail} vs {agreement.counterpartyEmail}
                  </p>
                </div>
              </div>

              {/* Suggested Firms */}
              {agreement.suggestedFirms.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    AI-Suggested Firms
                  </p>
                  <div className="space-y-2">
                    {agreement.suggestedFirms.slice(0, 2).map((suggestion) => (
                      <div
                        key={suggestion.firmId}
                        className="flex items-center justify-between bg-slate-900/60 rounded p-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{suggestion.firmName}</p>
                          <p className="text-xs text-slate-400">{suggestion.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                            {suggestion.matchScore}% match
                          </Badge>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-600"
                            onClick={() => onAssign(agreement.id, suggestion.firmId)}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-700 text-slate-300"
                  onClick={() => onViewDetails(agreement.id)}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  onClick={() => {
                    // Manual assignment flow
                    setSelectedAgreement(agreement.id)
                  }}
                >
                  Manual Assign
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

