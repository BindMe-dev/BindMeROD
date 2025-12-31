"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import {
  Shield,
  Users,
  FileText,
  AlertTriangle,
  UserPlus,
  UserMinus,
  RefreshCw,
  HandCoins,
  Briefcase,
  Building2,
  Megaphone,
  Settings,
} from "lucide-react"

interface AdminSummary {
  stats: { total: number; byStatus: Record<string, number> }
  pendingVerifications: Array<{ id: string; email: string; name: string | null; createdAt: string | null }>
  recentAgreements: Array<{ id: string; title: string; status: string | null; createdAt: string | null }>
}

interface AdminUserRow {
  id: string
  email: string
  name: string
  isVerified: boolean
  createdAt: string | null
  verificationType: string | null
  isAdmin: boolean
}

interface AdminVerification {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  status: string
  createdAt: string | null
  updatedAt: string | null
  verificationType?: string | null
  reviewNotes?: string | null
  rejectionReason?: string | null
  documentUrl?: string | null
  selfieUrl?: string | null
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [verifications, setVerifications] = useState<AdminVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [verificationFilter, setVerificationFilter] = useState("")
  const [verificationStatus, setVerificationStatus] = useState<"all" | "pending" | "processing" | "approved" | "rejected">(
    "all",
  )
  const [decisionTargetId, setDecisionTargetId] = useState<string | null>(null)
  const [decisionMode, setDecisionMode] = useState<"approve" | "reject" | null>(null)
  const [decisionNotes, setDecisionNotes] = useState("")
  const pathname = usePathname() || "/admin"
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "N/A"

  const statusBadge = (status?: string) => {
    const base = "px-2 py-1 rounded text-xs border"
    switch ((status || "").toLowerCase()) {
      case "approved":
      case "success":
        return `${base} bg-green-500/20 text-green-200 border-green-500/40`
      case "rejected":
      case "failed":
        return `${base} bg-red-500/20 text-red-200 border-red-500/40`
      case "needs_info":
      case "needs-info":
        return `${base} bg-amber-500/20 text-amber-100 border-amber-500/40`
      case "processing":
        return `${base} bg-blue-500/20 text-blue-200 border-blue-500/40`
      default:
        return `${base} bg-amber-500/20 text-amber-200 border-amber-500/40`
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin", { credentials: "include" })
      const data = await res.json()
      if (!res.ok || !data.isAdmin) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      setIsAdmin(true)
      const [summaryRes, usersRes, verRes] = await Promise.all([
        fetch("/api/admin/summary", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/verifications", { credentials: "include" }),
      ])

      if (!summaryRes.ok) throw new Error("Failed to load admin summary")
      if (!usersRes.ok) throw new Error("Failed to load users")

      const summaryData = await summaryRes.json()
      const usersData = await usersRes.json()
      setSummary(summaryData)
      setAdminUsers(usersData.users || [])

      if (verRes.ok) {
        const verData = await verRes.json()
        setVerifications(verData.submissions || [])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admin dashboard")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-300">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading admin dashboard...
        </div>
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-lg">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 lg:pb-8">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start pt-16">
          <AdminSidebar />

          <div className="space-y-6">
            <div className="flex items-center justify-between pt-2 lg:pt-0">
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm">Overview of verifications, agreements, and users.</p>
              </div>
              <Badge className="bg-slate-800 text-slate-200 border border-slate-700 gap-2 lg:hidden">
                <Shield className="w-4 h-4" />
                Admin
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="text-slate-200 border-slate-700 hover:bg-slate-800"
                onClick={load}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Agreements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-white">{summary?.stats.total ?? 0}</p>
              <div className="space-y-1 text-sm text-slate-300">
                {summary &&
                  Object.entries(summary.stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="capitalize">{status}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Pending Verifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-white">{summary?.pendingVerifications.length ?? 0}</p>
              <p className="text-sm text-slate-300">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold text-white">Protected</p>
              <p className="text-sm text-slate-300">Access restricted to admin accounts.</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-white">Verification Queue</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-300 hover:text-white"
                  onClick={load}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reload
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                placeholder="Filter by email/name/status"
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
              />
              <div className="flex gap-2 text-xs text-slate-300 flex-wrap">
                {(["all", "pending", "processing", "approved", "rejected"] as const).map((status) => (
                  <button
                    key={status}
                    className={`px-2 py-1 rounded border transition ${
                      verificationStatus === status
                        ? "bg-blue-900/60 border-blue-700 text-blue-100"
                        : "bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                    onClick={() => setVerificationStatus(status)}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              {verifications.length === 0 && <p className="text-sm text-slate-400">No pending verifications.</p>}
              {verifications
                .filter((v) => {
                  const q = verificationFilter.toLowerCase()
                  const matchesQuery =
                    (v.userEmail || "").toLowerCase().includes(q) ||
                    (v.userName || "").toLowerCase().includes(q) ||
                    (v.status || "").toLowerCase().includes(q)
                  const matchesStatus =
                    verificationStatus === "all" || (v.status || "").toLowerCase() === verificationStatus
                  return matchesQuery && matchesStatus
                })
                .map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white truncate">{v.userName || "Unknown user"}</p>
                      <span className={statusBadge(v.status)}>{v.status || "pending"}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{v.userEmail}</p>
                    <p className="text-xs text-slate-500">Created: {formatDate(v.createdAt)}</p>
                    <p className="text-xs text-slate-500">Updated: {formatDate(v.updatedAt)}</p>
                    {v.documentUrl && (
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>
                          Document:{" "}
                          <a href={v.documentUrl} className="text-blue-300 underline" target="_blank" rel="noreferrer">
                            View
                          </a>
                        </p>
                        {v.documentUrl.startsWith("data:") && (
                          <img src={v.documentUrl} alt="Document preview" className="max-h-24 rounded border border-slate-800" />
                        )}
                      </div>
                    )}
                    {v.selfieUrl && (
                      <div className="text-xs text-slate-300 space-y-1">
                        <p>
                          Selfie:{" "}
                          <a href={v.selfieUrl} className="text-blue-300 underline" target="_blank" rel="noreferrer">
                            View
                          </a>
                        </p>
                        {v.selfieUrl.startsWith("data:") && (
                          <img src={v.selfieUrl} alt="Selfie preview" className="max-h-24 rounded border border-slate-800" />
                        )}
                      </div>
                    )}
                    {v.reviewNotes && (
                      <p className="text-xs text-blue-300 mt-1">Notes: {v.reviewNotes}</p>
                    )}
                    {v.rejectionReason && (
                      <p className="text-xs text-red-300 mt-1">Rejection: {v.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setDecisionTargetId(v.id)
                        setDecisionMode("approve")
                        setDecisionNotes("")
                      }}
                      disabled={v.status === 'approved' || v.status === 'rejected'}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-300 border-red-500/40 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        setDecisionTargetId(v.id)
                        setDecisionMode("reject")
                        setDecisionNotes("")
                      }}
                      disabled={v.status === 'approved' || v.status === 'rejected'}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              {decisionTargetId && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-2">
                  <p className="text-sm text-slate-200">
                    {decisionMode === "approve" ? "Approve submission" : "Reject submission"}
                  </p>
                  <textarea
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
                    placeholder={decisionMode === "approve" ? "Add review notes (optional)" : "Reason for rejection (optional)"}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={decisionMode === "reject" && decisionNotes.trim().length === 0}
                      className={decisionMode === "approve" ? "bg-green-600 hover:bg-green-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}
                      onClick={async () => {
                        const status = decisionMode === "approve" ? "approved" : "rejected"
                        await fetch("/api/admin/verifications", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            action: "update",
                            submissionId: decisionTargetId,
                            status,
                            notes: decisionMode === "approve" ? decisionNotes : undefined,
                            rejectionReason: decisionMode === "reject" ? decisionNotes : undefined,
                          }),
                        })
                        setVerifications((prev) =>
                          prev.map((row) =>
                            row.id === decisionTargetId
                              ? {
                                  ...row,
                                  status,
                                  reviewNotes: decisionMode === "approve" ? decisionNotes : row.reviewNotes,
                                  rejectionReason: decisionMode === "reject" ? decisionNotes : row.rejectionReason,
                                }
                              : row,
                          ),
                        )
                        setDecisionTargetId(null)
                        setDecisionMode(null)
                        setDecisionNotes("")
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDecisionTargetId(null)
                        setDecisionMode(null)
                        setDecisionNotes("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Agreements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(summary?.recentAgreements || []).length === 0 && (
                <p className="text-sm text-slate-400">No agreements yet.</p>
              )}
              {(summary?.recentAgreements || []).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{a.title || "Untitled agreement"}</p>
                    <p className="text-xs text-slate-400">{a.id}</p>
                  </div>
                  <Badge className="capitalize bg-slate-800 text-slate-200 border border-slate-700">{a.status || "unknown"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Users & Admins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by name/email"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
              />
            </div>
            {adminUsers.length === 0 && <p className="text-sm text-slate-400">No users found.</p>}
            <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900/60">
              {adminUsers
                .filter((u) => {
                  const q = userFilter.toLowerCase()
                  if (!q) return true
                  return (
                    (u.name || "").toLowerCase().includes(q) ||
                    (u.email || "").toLowerCase().includes(q)
                  )
                })
                .map((u) => (
                <div key={u.id} className="flex items-center justify-between px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{u.name || "Unknown user"}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    <div className="flex gap-2 mt-1">
                      {u.isVerified ? (
                        <Badge className="bg-green-500/20 text-green-200 border border-green-500/40">Verified</Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-200 border border-amber-500/40">Unverified</Badge>
                      )}
                      {u.isAdmin && (
                        <Badge className="bg-blue-500/20 text-blue-200 border border-blue-500/40">Admin</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.isAdmin ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-300 border-red-500/40 hover:bg-red-500/10"
                        onClick={async () => {
                          await fetch(`/api/admin/users/${u.id}/promote`, { method: "DELETE", credentials: "include" })
                          setAdminUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, isAdmin: false } : row)))
                        }}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Remove Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-300 border-green-500/40 hover:bg-green-500/10"
                        onClick={async () => {
                          await fetch(`/api/admin/users/${u.id}/promote`, { method: "POST", credentials: "include" })
                          setAdminUsers((prev) => prev.map((row) => (row.id === u.id ? { ...row, isAdmin: true } : row)))
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Make Admin
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HandCoins className="w-4 h-4" />
                Expenses & Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p className="text-slate-400">Track company spend, vendor payouts, and subscription costs.</p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs text-slate-400">Coming soon: charts and approval queues.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Strategy & Ops
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p className="text-slate-400">House OKRs, project health, risk items, and cross-team decisions.</p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs text-slate-400">Stub section—ready to connect to your planning data.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Law Firms & Partners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p className="text-slate-400">Registry for partner firms, contacts, and engagement status.</p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs text-slate-400">Stub section—wire to partner CRM or Supabase table.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                Marketing & Growth
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p className="text-slate-400">Campaigns, announcements, and user segments for outreach.</p>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <p className="text-xs text-slate-400">Stub section—ready for metrics and scheduling UI.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/80 border border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Admin Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p className="text-slate-400">Role management, audit exports, and platform-wide toggles.</p>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <p className="text-xs text-slate-400">Stub section—connect to feature flags and RBAC controls.</p>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
      <AdminMobileNav />
    </div>
  )
}
