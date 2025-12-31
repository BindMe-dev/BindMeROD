"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Briefcase,
  TrendingUp,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Star,
  Settings,
} from "lucide-react"

export default function FirmDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [firmData, setFirmData] = useState<any>(null)

  useEffect(() => {
    // TODO: Implement firm authentication
    // For now, redirect to login
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/firm/auth/me")
        if (res.ok) {
          const data = await res.json()
          setFirmData(data.firm)
        } else {
          router.push("/firm/login")
        }
      } catch (error) {
        router.push("/firm/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Law Firm Portal</h1>
              <p className="text-sm text-slate-400">Manage your cases and services</p>
            </div>
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => router.push("/firm/settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
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
                <Briefcase className="w-4 h-4" />
                Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">12</div>
              <p className="text-xs text-blue-200 mt-1">+3 this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/40 border-green-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">87%</div>
              <p className="text-xs text-green-200 mt-1">Above average</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 border-purple-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-200 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Revenue (MTD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">£8,500</div>
              <p className="text-xs text-purple-200 mt-1">+15% vs last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/40 border-amber-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-200 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">4.6</div>
              <p className="text-xs text-amber-200 mt-1">127 reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cases" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="cases">My Cases</TabsTrigger>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="cases" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader>
                <CardTitle>Active Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-center py-8">
                  No active cases at the moment
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader>
                <CardTitle>Pending Consultation Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-center py-8">
                  No pending requests
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader>
                <CardTitle>Completed Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-center py-8">
                  No completed cases yet
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

