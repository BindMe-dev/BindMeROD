"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  Star,
  Activity,
  UserPlus,
  Award,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react"

interface NetworkInsightsProps {
  userId: string
}

export function NetworkInsightsPanel({ userId }: NetworkInsightsProps) {
  const [insights, setInsights] = useState({
    totalConnections: 0,
    activeConnections: 0,
    averageTrustScore: 0,
    networkGrowthRate: 0,
    networkHealth: 'fair' as 'excellent' | 'good' | 'fair' | 'poor',
    topPartners: [] as Array<{
      userId: string
      name: string
      agreementCount: number
      completionRate: number
      trustScore: number
    }>,
    suggestions: [] as Array<{
      id: string
      name: string
      reason: string
      mutualConnections: number
    }>,
  })

  useEffect(() => {
    // TODO: Fetch from API
    // Mock data for now
    setInsights({
      totalConnections: 24,
      activeConnections: 18,
      averageTrustScore: 4.3,
      networkGrowthRate: 15,
      networkHealth: 'good',
      topPartners: [
        {
          userId: '1',
          name: 'Sarah Johnson',
          agreementCount: 8,
          completionRate: 0.95,
          trustScore: 4.8,
        },
        {
          userId: '2',
          name: 'Michael Chen',
          agreementCount: 6,
          completionRate: 0.92,
          trustScore: 4.6,
        },
      ],
      suggestions: [
        {
          id: '1',
          name: 'Emma Wilson',
          reason: 'mutual_connection',
          mutualConnections: 3,
        },
        {
          id: '2',
          name: 'David Brown',
          reason: 'similar_agreements',
          mutualConnections: 2,
        },
      ],
    })
  }, [userId])

  const healthColor = {
    excellent: 'text-green-400',
    good: 'text-blue-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400',
  }[insights.networkHealth]

  const healthBg = {
    excellent: 'bg-green-500/20 border-green-500/30',
    good: 'bg-blue-500/20 border-blue-500/30',
    fair: 'bg-yellow-500/20 border-yellow-500/30',
    poor: 'bg-red-500/20 border-red-500/30',
  }[insights.networkHealth]

  return (
    <div className="space-y-4">
      {/* Network Health Overview */}
      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Network Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-lg border p-4 ${healthBg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Overall Status</span>
              <Badge className={`${healthColor} bg-transparent border-0`}>
                {insights.networkHealth.toUpperCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-2xl font-bold text-white">{insights.totalConnections}</p>
                <p className="text-xs text-slate-400">Total Connections</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{insights.activeConnections}</p>
                <p className="text-xs text-slate-400">Active This Month</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">Average Trust Score</span>
                <span className="text-sm font-semibold text-white">
                  {insights.averageTrustScore.toFixed(1)}/5.0
                </span>
              </div>
              <Progress value={insights.averageTrustScore * 20} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">Network Growth</span>
                <span className="text-sm font-semibold text-green-400">
                  +{insights.networkGrowthRate}%
                </span>
              </div>
              <Progress value={Math.min(insights.networkGrowthRate, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Partners */}
      {insights.topPartners.length > 0 && (
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Top Partners
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.topPartners.map((partner, index) => (
              <div
                key={partner.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{partner.name}</p>
                    <p className="text-xs text-slate-400">
                      {partner.agreementCount} agreements • {(partner.completionRate * 100).toFixed(0)}% completion
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-semibold text-white">{partner.trustScore.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

