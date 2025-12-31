"use client"

import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock, TrendingUp, Calendar, Target, Trophy, BarChart3, Users, FileText } from "lucide-react"

export default function StatisticsPage() {
  const { user, isLoading } = useAuth()
  const { agreements } = useAgreements()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  const monthlyData = useMemo(() => {
    const months = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      
      const created = agreements.filter(a => {
        const createdDate = new Date(a.createdAt)
        return createdDate >= monthStart && createdDate <= monthEnd
      }).length
      
      const completed = agreements.filter(a => {
        if (!a.completedAt) return false
        const completedDate = new Date(a.completedAt)
        return completedDate >= monthStart && completedDate <= monthEnd
      }).length
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        created,
        completed
      })
    }
    
    return months
  }, [agreements])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  const totalAgreements = agreements.length
  const activeAgreements = agreements.filter((a) => a.status === "active").length
  const completedAgreements = agreements.filter((a) => a.status === "completed").length
  const overdueAgreements = agreements.filter((a) => a.status === "overdue").length

  const completionRate = totalAgreements > 0 ? Math.round((completedAgreements / totalAgreements) * 100) : 0

  const oneTimeAgreements = agreements.filter((a) => a.type === "one-time").length
  const recurringAgreements = agreements.filter((a) => a.type === "recurring").length
  const deadlineAgreements = agreements.filter((a) => a.type === "deadline").length
  const betAgreements = agreements.filter((a) => a.type === "bet").length

  const recurringCompletions = agreements
    .filter((a) => a.type === "recurring")
    .reduce((total, agreement) => {
      return total + (agreement.completions?.filter((c) => c.completed).length || 0)
    }, 0)

  const recurringTotal = agreements
    .filter((a) => a.type === "recurring")
    .reduce((total, agreement) => {
      return total + (agreement.completions?.length || 0)
    }, 0)

  const recurringCompletionRate = recurringTotal > 0 ? Math.round((recurringCompletions / recurringTotal) * 100) : 0

  const recentCompletions = agreements
    .filter((a) => a.status === "completed")
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
    .slice(0, 5)

  // Partner statistics
  const uniquePartners = new Set(
    agreements.flatMap(a => 
      (a.sharedWith || []).map(p => p.userEmail || p.userId).filter(Boolean)
    )
  ).size

  const mostActivePartners = agreements
    .flatMap(a => (a.sharedWith || []).map(p => p.userEmail || p.userName || 'Unknown'))
    .reduce((acc, partner) => {
      acc[partner] = (acc[partner] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  const topPartners = Object.entries(mostActivePartners)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-slate-950 to-purple-900/10" />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Statistics</h1>
            <p className="text-slate-400">Track your accountability progress and performance</p>
          </div>

          {/* Enhanced Analytics Dashboard */}
          <AnalyticsDashboard agreements={agreements} />

          {/* Monthly Trend Chart */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                12-Month Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span className="text-slate-300">Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-slate-300">Completed</span>
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-2 h-40">
                  {monthlyData.map((month, index) => {
                    const maxValue = Math.max(...monthlyData.map(m => Math.max(m.created, m.completed)))
                    const createdHeight = maxValue > 0 ? (month.created / maxValue) * 100 : 0
                    const completedHeight = maxValue > 0 ? (month.completed / maxValue) * 100 : 0
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <div className="flex-1 flex flex-col justify-end gap-1 w-full">
                          <div 
                            className="bg-blue-500 rounded-t"
                            style={{ height: `${createdHeight}%`, minHeight: month.created > 0 ? '4px' : '0' }}
                            title={`Created: ${month.created}`}
                          />
                          <div 
                            className="bg-green-500 rounded-t"
                            style={{ height: `${completedHeight}%`, minHeight: month.completed > 0 ? '4px' : '0' }}
                            title={`Completed: ${month.completed}`}
                          />
                        </div>
                        <span className="text-xs text-slate-400 transform -rotate-45 origin-center">
                          {month.month}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Analytics */}
          {uniquePartners > 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Partner Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Total Partners</span>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                        {uniquePartners}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Shared Agreements</span>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                        {agreements.filter(a => a.isShared).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Avg. Partners per Agreement</span>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                        {agreements.length > 0 ? 
                          (agreements.reduce((sum, a) => sum + (a.sharedWith?.length || 0), 0) / agreements.length).toFixed(1) 
                          : '0'
                        }
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">Most Active Partners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPartners.length > 0 ? (
                      topPartners.map(([partner, count], index) => (
                        <div key={partner} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="text-slate-300 truncate">{partner}</span>
                          </div>
                          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                            {count}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 text-sm">No partner data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Legacy Statistics */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Target className="w-6 h-6" />}
              title="Total Agreements"
              value={totalAgreements}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Active"
              value={activeAgreements}
              gradient="from-green-500 to-emerald-500"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="Completed"
              value={completedAgreements}
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              title="Overdue"
              value={overdueAgreements}
              gradient="from-red-500 to-pink-500"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {completionRate}%
                    </div>
                    <div className="text-slate-400 pb-2">
                      {completedAgreements} of {totalAgreements} completed
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Agreement Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-slate-300">One-Time</span>
                    </div>
                    <span className="font-bold text-white">{oneTimeAgreements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-300">Recurring</span>
                    </div>
                    <span className="font-bold text-white">{recurringAgreements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-red-400" />
                      <span className="text-slate-300">Deadline</span>
                    </div>
                    <span className="font-bold text-white">{deadlineAgreements}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="text-slate-300">Bet / Wager</span>
                    </div>
                    <span className="font-bold text-white">{betAgreements}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {recurringAgreements > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recurring Agreement Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-end gap-3">
                    <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {recurringCompletionRate}%
                    </div>
                    <div className="text-slate-400 pb-2">
                      {recurringCompletions} of {recurringTotal} occurrences completed
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${recurringCompletionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {recentCompletions.length > 0 && (
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCompletions.map((agreement) => (
                    <div
                      key={agreement.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-200"
                      onClick={() => router.push(`/agreement/${agreement.id}`)}
                    >
                      <div>
                        <p className="font-medium text-white">{agreement.title}</p>
                        <p className="text-sm text-slate-400">
                          {agreement.completedAt &&
                            new Date(agreement.completedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon, title, value, gradient }: {
  icon: React.ReactNode
  title: string
  value: number
  gradient: string
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center text-white`}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-slate-400 text-sm">{title}</p>
        </div>
      </CardContent>
    </Card>
  )
}
