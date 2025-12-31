"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Activity,
  ArrowLeft,
  BarChart3,
  PieChart,
  Calendar
} from "lucide-react"
import { AdminMobileNav } from "@/components/admin-mobile-nav"

export default function AnalyticsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("30d")
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.isAdmin) {
          setIsAdmin(true)
          fetchAnalytics("30d")
        } else {
          router.push("/dashboard")
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      const res = await fetch(`/api/admin/analytics?period=${selectedPeriod}`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    fetchAnalytics(newPeriod)
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 lg:pb-0">
      {/* Mobile Navigation */}
      <AdminMobileNav />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin")}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Analytics Dashboard</h1>
                <p className="text-sm text-slate-400">Platform insights and metrics</p>
              </div>
            </div>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-200 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.overview?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Total Agreements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.overview?.totalAgreements || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-200 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Agreements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.overview?.activeAgreements || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/40 to-red-800/40 border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Disputed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {analytics?.overview?.disputedAgreements || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                Agreement Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Chart visualization coming soon</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Distribution by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 text-sm">Chart visualization coming soon</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

