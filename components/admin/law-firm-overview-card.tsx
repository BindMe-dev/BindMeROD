"use client"

/**
 * Law Firm Overview Card
 * 
 * WHY: Admins need a quick snapshot of law firm performance to make decisions about
 * which firms to feature, suspend, or promote. This card shows key metrics at a glance.
 * 
 * BUSINESS VALUE:
 * - Identify top-performing firms for featured placement (revenue opportunity)
 * - Spot underperforming firms early (quality control)
 * - Track revenue generation per firm (business metrics)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Building2,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react"

interface LawFirmOverviewProps {
  firm: {
    id: string
    name: string
    status: 'active' | 'onboarding' | 'suspended'
    totalCases: number
    activeCases: number
    completedCases: number
    successRate: number // percentage
    avgResponseTime: number // hours
    totalRevenue: number // £
    userRating: number // 0-5
    practiceAreas: string[]
  }
  onViewDetails: () => void
  onAssignCase: () => void
  onSuspend: () => void
}

export function LawFirmOverviewCard({ firm, onViewDetails, onAssignCase, onSuspend }: LawFirmOverviewProps) {
  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    onboarding: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const performanceScore = (firm.successRate + firm.userRating * 20) / 2

  return (
    <Card className="bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{firm.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${statusColors[firm.status]} border`}>
                  {firm.status.toUpperCase()}
                </Badge>
                {performanceScore >= 80 && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                    ⭐ Top Performer
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold">{firm.userRating.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricBox
            icon={<FileText className="w-4 h-4" />}
            label="Active Cases"
            value={firm.activeCases}
            color="text-blue-400"
          />
          <MetricBox
            icon={<TrendingUp className="w-4 h-4" />}
            label="Success Rate"
            value={`${firm.successRate}%`}
            color="text-green-400"
          />
          <MetricBox
            icon={<Clock className="w-4 h-4" />}
            label="Avg Response"
            value={`${firm.avgResponseTime}h`}
            color="text-purple-400"
          />
          <MetricBox
            icon={<DollarSign className="w-4 h-4" />}
            label="Revenue"
            value={`£${(firm.totalRevenue / 1000).toFixed(1)}k`}
            color="text-yellow-400"
          />
        </div>

        {/* Practice Areas */}
        <div>
          <p className="text-xs text-slate-400 mb-2">Practice Areas</p>
          <div className="flex flex-wrap gap-1">
            {firm.practiceAreas.slice(0, 3).map((area) => (
              <Badge key={area} variant="outline" className="text-xs border-slate-700 text-slate-300">
                {area}
              </Badge>
            ))}
            {firm.practiceAreas.length > 3 && (
              <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                +{firm.practiceAreas.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={onViewDetails}
          >
            View Details
          </Button>
          {firm.status === 'active' && (
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={onAssignCase}
            >
              Assign Case
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MetricBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3">
      <div className={`flex items-center gap-1 mb-1 ${color}`}>
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}

