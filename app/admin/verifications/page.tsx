"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, FileSearch, RefreshCw, Filter, Mail, Clock, CheckCircle2, XCircle } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface SubmissionRow {
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

export default function AdminVerificationsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState("")
  const [rows, setRows] = useState<SubmissionRow[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "processing" | "approved" | "rejected" | "needs_info">(
    "all",
  )
  const [selected, setSelected] = useState<SubmissionRow | null>(null)
  const [decisionNotes, setDecisionNotes] = useState("")
  const [decisionMode, setDecisionMode] = useState<"approve" | "reject" | "needs_info" | null>(null)

  const load = async () => {
    setTableLoading(true)
    setTableError("")
    try {
      const res = await fetch("/api/admin/verifications", { credentials: "include" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load verifications")
      }
      const data = await res.json()
      setRows(data.submissions || [])
      if (!selected && data.submissions?.length) setSelected(data.submissions[0])
    } catch (e) {
      setTableError(e instanceof Error ? e.message : "Failed to load verifications")
    } finally {
      setTableLoading(false)
    }
  }

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        if (data.isAdmin) {
          setIsAdmin(true)
          await load()
        } else {
          setIsAdmin(false)
        }
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchesStatus = statusFilter === "all" || (r.status || "").toLowerCase() === statusFilter
      const q = search.toLowerCase()
      const matchesSearch = !q || (r.userEmail || "").toLowerCase().includes(q) || (r.userName || "").toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [rows, statusFilter, search])

  const statusBadge = (status?: string) => {
    const base = "px-2 py-1 rounded text-xs border capitalize"
    switch ((status || "").toLowerCase()) {
      case "approved":
        return `${base} bg-green-500/20 text-green-100 border-green-600/40`
      case "rejected":
        return `${base} bg-red-500/20 text-red-100 border-red-600/40`
      case "needs_info":
      case "needs-info":
        return `${base} bg-amber-500/20 text-amber-100 border-amber-600/40`
      case "processing":
        return `${base} bg-blue-500/20 text-blue-100 border-blue-600/40`
      default:
        return `${base} bg-slate-800 text-slate-200 border-slate-700`
    }
  }

  const submitDecision = async () => {
    if (!selected || !decisionMode) return
    if (decisionMode !== "approve" && !decisionNotes.trim()) {
      setTableError("Please provide notes for non-approval decisions.")
      return
    }
    setTableLoading(true)
    setTableError("")
    try {
      const status = decisionMode === "approve" ? "approved" : decisionMode === "reject" ? "rejected" : "needs_info"
      await fetch("/api/admin/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update",
          submissionId: selected.id,
          status,
          notes: decisionMode === "approve" ? decisionNotes : undefined,
          rejectionReason: decisionMode !== "approve" ? decisionNotes : undefined,
        }),
      })
      await load()
      setDecisionNotes("")
      setDecisionMode(null)
    } catch (e) {
      setTableError(e instanceof Error ? e.message : "Failed to update submission")
    } finally {
      setTableLoading(false)
    }
  }

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
                <h1 className="text-2xl font-bold">Verifications</h1>
                <p className="text-slate-400 text-sm">Review ID submissions and decisions.</p>
              </div>
              <div className="flex gap-2">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.4fr] gap-4">
              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileSearch className="w-4 h-4" />
                    Verification Queue
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Filter by email/name/status..."
                      className="bg-slate-900 border-slate-700 text-slate-100 w-56"
                    />
                    <Button variant="outline" size="sm" onClick={() => load()}>
                      <Filter className="w-4 h-4 mr-1" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 text-xs flex-wrap">
                    {(["all", "pending", "processing", "needs_info", "approved", "rejected"] as const).map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`capitalize ${statusFilter === s ? "border-blue-500 text-blue-100" : "border-slate-700 text-slate-200"}`}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 max-h-[520px] overflow-auto">
                    {tableLoading && (
                      <div className="p-4 text-sm text-slate-300 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        Loading submissions...
                      </div>
                    )}
                    {tableError && (
                      <div className="p-3 text-sm text-red-400 border-b border-red-800/50">{tableError}</div>
                    )}
                    {filteredRows.length === 0 && !tableLoading && (
                      <div className="p-4 text-sm text-slate-400">No submissions found.</div>
                    )}
                    {filteredRows.map((row) => (
                      <button
                        key={row.id}
                        onClick={() => setSelected(row)}
                        className={`w-full text-left px-4 py-3 border-b border-slate-800 flex items-center justify-between hover:bg-slate-800/60 ${
                          selected?.id === row.id ? "bg-slate-800/80" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{row.userName || "Unknown user"}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {row.userEmail}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                          </p>
                        </div>
                        <span className={statusBadge(row.status)}>{row.status || "pending"}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Review Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  {!selected && <p className="text-slate-400">Select a submission to review.</p>}
                  {selected && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">{selected.userName || "Unknown user"}</p>
                          <p className="text-xs text-slate-400">{selected.userEmail}</p>
                        </div>
                        <Badge className={statusBadge(selected.status)}>{selected.status || "pending"}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>
                          <p className="text-slate-500">Submitted</p>
                          <p className="text-white">{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Updated</p>
                          <p className="text-white">{selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {selected.documentUrl && (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400">Document</p>
                            <a href={selected.documentUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">
                              View document
                            </a>
                            {selected.documentUrl.startsWith("data:") && (
                              <img src={selected.documentUrl} alt="Document" className="max-h-40 rounded border border-slate-800" />
                            )}
                          </div>
                        )}
                        {selected.selfieUrl && (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-400">Selfie</p>
                            <a href={selected.selfieUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline">
                              View selfie
                            </a>
                            {selected.selfieUrl.startsWith("data:") && (
                              <img src={selected.selfieUrl} alt="Selfie" className="max-h-40 rounded border border-slate-800" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Decision notes (required for reject/needs info)</p>
                        <Textarea
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                          rows={3}
                          className="bg-slate-900 border-slate-700 text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Add reviewer comments..."
                          disabled={selected.status === 'approved' || selected.status === 'rejected'}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            setDecisionMode("approve")
                            submitDecision()
                          }}
                          disabled={selected.status === 'approved' || selected.status === 'rejected'}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-200 border-amber-500/40 hover:bg-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            setDecisionMode("needs_info")
                            submitDecision()
                          }}
                          disabled={selected.status === 'approved' || selected.status === 'rejected'}
                        >
                          Needs info
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-300 border-red-500/40 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => {
                            setDecisionMode("reject")
                            submitDecision()
                          }}
                          disabled={selected.status === 'approved' || selected.status === 'rejected'}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                      {(selected.status === 'approved' || selected.status === 'rejected') ? (
                        <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-500/30 rounded px-2 py-1">
                          ⚠️ This submission has already been {selected.status}. Actions are disabled.
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Actions will notify the user by email and store the decision + notes for audit.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
