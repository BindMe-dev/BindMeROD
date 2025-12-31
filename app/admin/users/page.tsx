"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, RefreshCw, Shield, UserCog, Mail, ChevronLeft, ChevronRight } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function AdminUsersPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)
  const [search, setSearch] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "true" | "false">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all")
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState("")

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
        if (data.isAdmin) {
          await loadUsers(1, search, verifiedFilter, roleFilter)
        }
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  const loadUsers = async (
    pageParam: number,
    q: string,
    verified: "all" | "true" | "false",
    role: "all" | "admin" | "user",
  ) => {
    setTableLoading(true)
    setTableError("")
    try {
      const params = new URLSearchParams()
      params.set("page", String(pageParam))
      params.set("pageSize", String(pageSize))
      if (q) params.set("q", q)
      if (verified !== "all") params.set("verified", verified)
      if (role !== "all") params.set("role", role)
      const res = await fetch(`/api/admin/users?${params.toString()}`, { credentials: "include" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load users")
      }
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.total || 0)
      setPage(data.page || pageParam)
    } catch (e) {
      setTableError(e instanceof Error ? e.message : "Failed to load users")
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
    <div className="min-h-screen bg-slate-950 text-white pb-20 lg:pb-8">
      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 pt-16">
          <AdminSidebar />
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-slate-400 text-sm">Manage accounts, roles, and status.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-200 border-slate-700 hover:bg-slate-800"
                  onClick={() => loadUsers(page, search, verifiedFilter, roleFilter)}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Admin & User Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <p>Assign roles, deactivate accounts, and review onboarding states.</p>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadUsers(1, e.currentTarget.value, verifiedFilter, roleFilter)
                    }}
                    placeholder="Search by name or email..."
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                  <div className="flex gap-2 text-xs flex-wrap">
                    {(["all", "true", "false"] as const).map((vf) => (
                      <Button
                        key={vf}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`capitalize ${verifiedFilter === vf ? "border-blue-500 text-blue-100" : "border-slate-700 text-slate-200"}`}
                        onClick={() => {
                          setVerifiedFilter(vf)
                          loadUsers(1, search, vf, roleFilter)
                        }}
                      >
                        {vf === "all" ? "All" : vf === "true" ? "Verified" : "Unverified"}
                      </Button>
                    ))}
                    {(["all", "admin", "user"] as const).map((rf) => (
                      <Button
                        key={rf}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`capitalize ${roleFilter === rf ? "border-blue-500 text-blue-100" : "border-slate-700 text-slate-200"}`}
                        onClick={() => {
                          setRoleFilter(rf)
                          loadUsers(1, search, verifiedFilter, rf)
                        }}
                      >
                        {rf === "all" ? "Any role" : rf === "admin" ? "Admins" : "Users"}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-200 border-slate-700 hover:bg-slate-800"
                    onClick={() => loadUsers(1, search, verifiedFilter, roleFilter)}
                  >
                    Search
                  </Button>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-200">
                      <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Role</th>
                          <th className="px-3 py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b border-slate-800/60">
                            <td className="px-3 py-2">
                              <div className="font-medium text-white">{u.name || "Unknown"}</div>
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <Badge
                                className={
                                  u.isVerified
                                    ? "bg-green-500/20 text-green-100 border border-green-600/40"
                                    : "bg-amber-500/20 text-amber-100 border border-amber-600/40"
                                }
                              >
                                {u.isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              {u.isAdmin ? (
                                <Badge className="bg-blue-500/20 text-blue-100 border border-blue-600/40">Admin</Badge>
                              ) : (
                                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">User</Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                        {users.length === 0 && !tableLoading && (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {tableLoading && (
                      <div className="p-4 text-sm text-slate-300">Loading users...</div>
                    )}
                    {tableError && (
                      <div className="p-4 text-sm text-red-400 border-t border-red-800/50">{tableError}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-400">
                    <span>
                      Page {page} • Showing {users.length} of {total} users
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => loadUsers(page - 1, search, verifiedFilter, roleFilter)}
                        className="text-slate-200 border-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page * pageSize >= total}
                        onClick={() => loadUsers(page + 1, search, verifiedFilter, roleFilter)}
                        className="text-slate-200 border-slate-700"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Role & Access Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>Define RBAC (admin, reviewer, support) and enforce 2FA for privileged accounts.</p>
                <Badge className="bg-blue-900/50 text-blue-100 border border-blue-700">Coming soon</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AdminMobileNav />
    </div>
  )
}
