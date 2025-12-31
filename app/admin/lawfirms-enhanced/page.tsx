"use client"

/**
 * Enhanced Law Firm Admin Dashboard
 * 
 * PRODUCT STRATEGY:
 * This page is the command center for managing the law firm marketplace. It connects
 * three critical workflows:
 * 
 * 1. LAW FIRM MANAGEMENT: Onboard, verify, and monitor law firm partners
 * 2. CASE ASSIGNMENT: Match disputed agreements with appropriate law firms
 * 3. PERFORMANCE TRACKING: Monitor success rates, revenue, and user satisfaction
 * 
 * WHY THIS MATTERS:
 * - Users: Get professional legal help when disputes can't be resolved
 * - Law Firms: Receive qualified leads without expensive marketing
 * - Platform: Generate revenue through commissions (15-20% of legal fees)
 * 
 * USER JOURNEY CONNECTION:
 * User creates agreement → Dispute arises → Friendly resolution fails →
 * User requests legal help → THIS PAGE assigns to law firm → Law firm resolves case
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { LawFirmOverviewCard } from "@/components/admin/law-firm-overview-card"
import { LegalResolutionQueue } from "@/components/admin/legal-resolution-queue"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  Users,
  DollarSign,
  Scale,
  AlertCircle,
} from "lucide-react"

export default function EnhancedLawFirmsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingFirms, setLoadingFirms] = useState(false)
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const [firms, setFirms] = useState<any[]>([])
  const [queuedAgreements, setQueuedAgreements] = useState<any[]>([])

  // Fetch law firms
  const fetchFirms = async () => {
    setLoadingFirms(true)
    try {
      const res = await fetch("/api/admin/lawfirms")
      if (res.ok) {
        const data = await res.json()
        // Transform data to match our component interface
        const transformedFirms = (data.firms || []).map((firm: any) => ({
          id: firm.id,
          name: firm.name,
          status: firm.status,
          totalCases: firm.totalCases || 0,
          activeCases: firm.activeCases || 0,
          completedCases: firm.completedCases || 0,
          successRate: firm.successRate || 0,
          avgResponseTime: firm.avgResponseTimeHours || 0,
          totalRevenue: firm.totalRevenue || 0,
          userRating: (firm.userRating || 0) / 10, // Convert from 0-50 to 0-5.0
          practiceAreas: firm.practiceAreas || [],
        }))
        setFirms(transformedFirms)
      }
    } catch (error) {
      console.error("Error fetching firms:", error)
    } finally {
      setLoadingFirms(false)
    }
  }

  // Fetch legal queue
  const fetchQueue = async () => {
    setLoadingQueue(true)
    try {
      const res = await fetch("/api/admin/legal-queue")
      if (res.ok) {
        const data = await res.json()
        setQueuedAgreements(data.queue || [])
      }
    } catch (error) {
      console.error("Error fetching queue:", error)
    } finally {
      setLoadingQueue(false)
    }
  }

  // Assign law firm to agreement
  const handleAssign = async (agreementId: string, firmId: string) => {
    setAssigning(true)
    try {
      const res = await fetch("/api/admin/assign-law-firm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, firmId }),
      })

      if (res.ok) {
        // Refresh queue after successful assignment
        await fetchQueue()
        await fetchFirms()
        alert("Case assigned successfully!")
      } else {
        const error = await res.json()
        alert(`Failed to assign case: ${error.error}`)
      }
    } catch (error) {
      console.error("Error assigning case:", error)
      alert("Failed to assign case")
    } finally {
      setAssigning(false)
    }
  }

  // Check admin status and load data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.isAdmin) {
          setIsAdmin(true)
          // Load initial data
          fetchFirms()
          fetchQueue()
        } else {
          router.push("/dashboard")
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAdmin) return null

  const totalRevenue = firms.reduce((sum, f) => sum + f.totalRevenue, 0)
  const totalActiveCases = firms.reduce((sum, f) => sum + f.activeCases, 0)
  const avgSuccessRate = firms.length > 0
    ? firms.reduce((sum, f) => sum + f.successRate, 0) / firms.length
    : 0

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AdminSidebar />
      
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8 text-purple-400" />
                Law Firm Management
              </h1>
              <p className="text-slate-400 mt-1">
                Manage law firm partners and assign legal cases
              </p>
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Law Firm
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Active Firms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {firms.filter(f => f.status === 'active').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {firms.filter(f => f.status === 'onboarding').length} onboarding
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Active Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{totalActiveCases}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {queuedAgreements.length} awaiting assignment
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{avgSuccessRate.toFixed(0)}%</p>
                <p className="text-xs text-green-400 mt-1">↑ 5% from last month</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">£{(totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-xs text-slate-500 mt-1">Platform commission</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList className="bg-slate-900/80 border border-slate-800">
              <TabsTrigger value="queue" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Legal Queue ({queuedAgreements.length})
              </TabsTrigger>
              <TabsTrigger value="firms" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600">
                <Building2 className="w-4 h-4 mr-2" />
                Law Firms ({firms.length})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Legal Resolution Queue Tab */}
            <TabsContent value="queue" className="space-y-4">
              {loadingQueue ? (
                <Card className="bg-slate-900/80 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading legal queue...</p>
                  </CardContent>
                </Card>
              ) : (
                <LegalResolutionQueue
                  agreements={queuedAgreements}
                  onAssign={handleAssign}
                  onViewDetails={(agreementId) => {
                    router.push(`/agreements/${agreementId}`)
                  }}
                />
              )}
            </TabsContent>

            {/* Law Firms Tab */}
            <TabsContent value="firms" className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search law firms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-900/80 border-slate-800 text-white"
                  />
                </div>
                <Button
                  onClick={fetchFirms}
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  disabled={loadingFirms}
                >
                  {loadingFirms ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {loadingFirms ? (
                <Card className="bg-slate-900/80 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading law firms...</p>
                  </CardContent>
                </Card>
              ) : firms.length === 0 ? (
                <Card className="bg-slate-900/80 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No law firms found</p>
                    <p className="text-slate-500 text-sm mt-2">Add your first law firm to get started</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {firms
                    .filter((firm) =>
                      searchQuery === "" ||
                      firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      firm.practiceAreas.some((area: string) =>
                        area.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    )
                    .map((firm) => (
                      <LawFirmOverviewCard
                        key={firm.id}
                        firm={firm}
                        onViewDetails={() => router.push(`/admin/lawfirms/${firm.id}`)}
                        onAssignCase={() => {
                          // TODO: Open assignment modal with this firm pre-selected
                          alert(`Assign case to ${firm.name} - Feature coming soon`)
                        }}
                        onSuspend={() => {
                          // TODO: Suspend firm
                          if (confirm(`Are you sure you want to suspend ${firm.name}?`)) {
                            alert("Suspend feature coming soon")
                          }
                        }}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card className="bg-slate-900/80 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Performance Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">Analytics dashboard coming soon...</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Will include: Revenue trends, case resolution times, firm performance rankings,
                    user satisfaction scores, and more.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AdminMobileNav />
    </div>
  )
}

