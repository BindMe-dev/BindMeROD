"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Users, 
  FileText,
  CheckCircle2,
  AlertTriangle,
  Target,
  Zap
} from "lucide-react"
import type { Agreement } from "@/lib/agreement-types"

interface AnalyticsDashboardProps {
  agreements: Agreement[]
  className?: string
}

export function AnalyticsDashboard({ agreements, className }: AnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Basic counts
    const total = agreements.length
    const active = agreements.filter(a => a.status === 'active').length
    const completed = agreements.filter(a => a.status === 'completed').length
    const overdue = agreements.filter(a => a.status === 'overdue').length
    const pending = agreements.filter(a => a.status === 'pending').length

    // Time-based analysis
    const recentAgreements = agreements.filter(a => 
      new Date(a.createdAt) >= thirtyDaysAgo
    ).length
    
    const recentCompletions = agreements.filter(a => 
      a.status === 'completed' && 
      a.completedAt && 
      new Date(a.completedAt) >= thirtyDaysAgo
    ).length

    const weeklyAgreements = agreements.filter(a => 
      new Date(a.createdAt) >= sevenDaysAgo
    ).length

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    // Average time to completion
    const completedWithDates = agreements.filter(a => 
      a.status === 'completed' && a.completedAt && a.createdAt
    )
    
    const avgCompletionTime = completedWithDates.length > 0 
      ? Math.round(
          completedWithDates.reduce((sum, a) => {
            const created = new Date(a.createdAt).getTime()
            const completed = new Date(a.completedAt!).getTime()
            return sum + (completed - created)
          }, 0) / completedWithDates.length / (1000 * 60 * 60 * 24)
        )
      : 0

    // Category breakdown
    const categoryStats = agreements.reduce((acc, agreement) => {
      const category = agreement.category || 'uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Type breakdown
    const typeStats = agreements.reduce((acc, agreement) => {
      const type = agreement.type || 'one-time'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Upcoming deadlines (next 7 days)
    const upcomingDeadlines = agreements.filter(a => {
      if (!a.deadline || a.status !== 'active') return false
      const deadline = new Date(a.deadline)
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return deadline >= now && deadline <= nextWeek
    }).length

    // Partner engagement
    const uniquePartners = new Set(
      agreements.flatMap(a => 
        (a.sharedWith || []).map(p => p.userEmail || p.userId).filter(Boolean)
      )
    ).size

    return {
      total,
      active,
      completed,
      overdue,
      pending,
      recentAgreements,
      recentCompletions,
      weeklyAgreements,
      completionRate,
      avgCompletionTime,
      categoryStats,
      typeStats,
      upcomingDeadlines,
      uniquePartners
    }
  }, [agreements])

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { change: 0, trend: 'neutral' as const }
    const change = Math.round(((current - previous) / previous) * 100)
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    return { change: Math.abs(change), trend }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Agreements"
          value={analytics.total}
          icon={<FileText className="w-5 h-5" />}
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          icon={<Target className="w-5 h-5" />}
          gradient="from-green-500 to-emerald-500"
        />
        <MetricCard
          title="Active Now"
          value={analytics.active}
          icon={<Zap className="w-5 h-5" />}
          gradient="from-yellow-500 to-orange-500"
        />
        <MetricCard
          title="Partners"
          value={analytics.uniquePartners}
          icon={<Users className="w-5 h-5" />}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Status Overview */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Agreement Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusBar
            label="Completed"
            value={analytics.completed}
            total={analytics.total}
            color="green"
          />
          <StatusBar
            label="Active"
            value={analytics.active}
            total={analytics.total}
            color="blue"
          />
          <StatusBar
            label="Overdue"
            value={analytics.overdue}
            total={analytics.total}
            color="red"
          />
          <StatusBar
            label="Pending"
            value={analytics.pending}
            total={analytics.total}
            color="yellow"
          />
        </CardContent>
      </Card>

      {/* Recent Activity & Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">New agreements (30 days)</span>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                {analytics.recentAgreements}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Completed (30 days)</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                {analytics.recentCompletions}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">This week</span>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                {analytics.weeklyAgreements}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Avg. completion time</span>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                {analytics.avgCompletionTime} days
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Overdue agreements</span>
              <Badge variant="destructive" className="bg-red-500/20 text-red-400">
                {analytics.overdue}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Due this week</span>
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                {analytics.upcomingDeadlines}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Pending signatures</span>
              <Badge variant="secondary" className="bg-slate-500/20 text-slate-400">
                {analytics.pending}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category & Type Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Agreement Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.categoryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-slate-300 capitalize">{category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${(count / analytics.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Agreement Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.typeStats)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-slate-300 capitalize">{type.replace('-', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${(count / analytics.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, gradient }: {
  title: string
  value: string | number
  icon: React.ReactNode
  gradient: string
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-slate-400 text-sm">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBar({ label, value, total, color }: {
  label: string
  value: number
  total: number
  color: 'green' | 'blue' | 'red' | 'yellow'
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  const colorClasses = {
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    red: 'from-red-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 text-sm">{label}</span>
        <span className="text-slate-400 text-sm">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-slate-700"
      />
    </div>
  )
}