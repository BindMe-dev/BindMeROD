"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Megaphone, RefreshCw } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminMarketingPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-lg">You do not have access to the admin dashboard.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 pt-16">
          <AdminSidebar />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Marketing</h1>
                <p className="text-slate-400 text-sm">Campaigns, announcements, and growth.</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-slate-200 border-slate-700 hover:bg-slate-800"
                onClick={() => router.refresh()}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4" />
                  Marketing & Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>Manage broadcast announcements, targeted notifications, and campaign performance.</p>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Stub section—wire to your marketing data and scheduling tools.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
