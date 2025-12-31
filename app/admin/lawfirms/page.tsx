"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  BadgeAlert,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
} from "lucide-react"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type FirmStatus = "active" | "onboarding" | "suspended"

interface LawFirm {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  matters: number
  status: FirmStatus
  region: string
}

interface LawFirmContact {
  id: string
  firmId: string
  name: string
  email: string
  phone?: string
  role?: string
  priority?: number
  onCall?: boolean
}

interface LawFirmIntervention {
  id: string
  firmId: string
  agreementId?: string | null
  triggeredBy?: string | null
  triggeredAt?: string
  status: string
  notes?: string | null
  evidenceLinks?: string[]
  contactName?: string | null
  assignedContactId?: string | null
}

interface FirmAgreement {
  id: string
  title?: string | null
  status?: string | null
  createdAt?: string | null
  creatorEmail?: string | null
  counterpartyEmail?: string | null
  assignmentId?: string
  active?: boolean
  scope?: string | null
}

interface LawFirmAd {
  id: string
  firmId: string
  title: string
  body: string
  ctaText?: string | null
  ctaUrl?: string | null
  active: boolean
}
export default function AdminLawFirmsPage() {
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const [firms, setFirms] = useState<LawFirm[]>([])
  const [loadingFirms, setLoadingFirms] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | FirmStatus>("all")

  const [openForm, setOpenForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState("")
  const [formState, setFormState] = useState<Partial<LawFirm>>({
    id: undefined,
    name: "",
    contact: "",
    email: "",
    phone: "",
    region: "UK",
    status: "onboarding",
    matters: 0,
  })

  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null)
  const activeFirm = useMemo(() => firms.find((f) => f.id === selectedFirmId) || null, [firms, selectedFirmId])

  const [selectedTab, setSelectedTab] = useState<"overview" | "contacts" | "interventions" | "agreements" | "ads">(
    "overview",
  )

  const [contacts, setContacts] = useState<LawFirmContact[]>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactForm, setContactForm] = useState<Partial<LawFirmContact>>({})

  const [interventions, setInterventions] = useState<LawFirmIntervention[]>([])
  const [interventionsLoading, setInterventionsLoading] = useState(false)

const [ads, setAds] = useState<LawFirmAd[]>([])
const [adsLoading, setAdsLoading] = useState(false)
const [adForm, setAdForm] = useState<Partial<LawFirmAd>>({})
const [agreements, setAgreements] = useState<FirmAgreement[]>([])
const [agreementsLoading, setAgreementsLoading] = useState(false)
const [allAgreements, setAllAgreements] = useState<FirmAgreement[]>([])
const [allAgreementsLoading, setAllAgreementsLoading] = useState(false)
const [assignAgreementId, setAssignAgreementId] = useState("")
const [assignScope, setAssignScope] = useState("legal_resolution")
const [assignActive, setAssignActive] = useState(true)
const [assignError, setAssignError] = useState("")
const selectedAgreement = useMemo(
  () => allAgreements.find((a) => a.id === assignAgreementId.trim()) || null,
  [assignAgreementId, allAgreements],
)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        if (!data.isAdmin) {
          setIsAdmin(false)
          return
        }
        setIsAdmin(true)
        await loadFirms()
        await loadAllAgreements()
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadFirms = async () => {
    setLoadingFirms(true)
    setLoadError("")
    try {
      const firmsRes = await fetch("/api/admin/lawfirms", { credentials: "include" })
      if (!firmsRes.ok) throw new Error("Failed to load firms")
      const payload = await firmsRes.json()
      setFirms(payload.firms || [])
      if (!selectedFirmId && payload.firms?.length) {
        setSelectedFirmId(payload.firms[0].id)
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load firms")
    } finally {
      setLoadingFirms(false)
    }
  }

  const loadAllAgreements = async () => {
    setAllAgreementsLoading(true)
    try {
      const res = await fetch("/api/admin/agreements", { credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) setAllAgreements(data.agreements || [])
    } finally {
      setAllAgreementsLoading(false)
    }
  }

  useEffect(() => {
    if (!activeFirm) return

    const safeJson = async (res: Response) => {
      const raw = await res.text()
      return raw ? JSON.parse(raw) : {}
    }

    const loadContacts = async () => {
      setContactsLoading(true)
      try {
        const res = await fetch(`/api/admin/lawfirms/contacts?firmId=${activeFirm.id}`, { credentials: "include" })
        const data = await safeJson(res)
        if (res.ok) setContacts(data.contacts || [])
        else setContacts([])
      } catch {
        setContacts([])
      } finally {
        setContactsLoading(false)
      }
    }

    const loadInterventions = async () => {
      setInterventionsLoading(true)
      try {
        const res = await fetch(`/api/admin/lawfirms/interventions?firmId=${activeFirm.id}`, {
          credentials: "include",
        })
        const data = await safeJson(res)
        if (res.ok) setInterventions(data.interventions || [])
        else setInterventions([])
      } catch {
        setInterventions([])
      } finally {
        setInterventionsLoading(false)
      }
    }

    const loadAds = async () => {
      setAdsLoading(true)
      try {
        const res = await fetch(`/api/admin/lawfirms/ads?firmId=${activeFirm.id}`, { credentials: "include" })
        const data = await safeJson(res)
        if (res.ok) setAds(data.ads || [])
        else setAds([])
      } catch {
        setAds([])
      } finally {
        setAdsLoading(false)
      }
    }
    const loadAgreements = async () => {
      setAgreementsLoading(true)
      try {
        const res = await fetch(`/api/admin/agreements?firmId=${activeFirm.id}`, { credentials: "include" })
        const data = await safeJson(res)
        if (res.ok) setAgreements(data.agreements || [])
        else setAgreements([])
      } catch {
        setAgreements([])
      } finally {
        setAgreementsLoading(false)
      }
    }

    loadContacts()
    loadInterventions()
    loadAds()
    loadAgreements()
  }, [activeFirm])

  const startCreate = () => {
    setFormState({
      id: undefined,
      name: "",
      contact: "",
      email: "",
      phone: "",
      region: "UK",
      status: "onboarding",
      matters: 0,
    })
    setFormError("")
    setOpenForm(true)
  }

  const startEdit = (firm: LawFirm) => {
    setFormState({ ...firm })
    setFormError("")
    setOpenForm(true)
  }

  const saveFirm = async () => {
    if (!formState.name || !formState.contact || !formState.email) {
      setFormError("Name, contact, and email are required.")
      return
    }
    setSaving(true)
    setFormError("")
    try {
      const res = await fetch("/api/admin/lawfirms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formState, matters: Number(formState.matters || 0) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save firm")
      }
      const result = await res.json().catch(() => ({}))
      await loadFirms()
      if (result.id) setSelectedFirmId(result.id)
      setOpenForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save firm")
    } finally {
      setSaving(false)
    }
  }

  const deleteFirm = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/admin/lawfirms?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      setFirms((prev) => prev.filter((f) => f.id !== id))
      if (selectedFirmId === id) setSelectedFirmId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const saveContact = async () => {
    if (!activeFirm) return
    if (!contactForm.name || !contactForm.email) return
    const payload = { ...contactForm, firmId: activeFirm.id }
    const res = await fetch("/api/admin/lawfirms/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      setContactForm({})
      const data = await res.json().catch(() => ({}))
      if (data.contact) {
        setContacts((prev) => [...prev, data.contact])
      } else {
        setContacts((prev) => prev.map((c) => (c.id === payload.id ? { ...(c as any), ...payload } : c)))
      }
    }
  }

  const deleteContact = async (id: string) => {
    await fetch(`/api/admin/lawfirms/contacts?id=${id}`, { method: "DELETE", credentials: "include" })
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  const saveAd = async () => {
    if (!activeFirm) return
    if (!adForm.title || !adForm.body) return
    const payload = { ...adForm, firmId: activeFirm.id }
    const res = await fetch("/api/admin/lawfirms/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data.ad) setAds((prev) => [data.ad, ...prev])
      setAdForm({})
    }
  }

  const filteredFirms = firms.filter((firm) => {
    const q = search.toLowerCase()
    const matchesQuery = firm.name.toLowerCase().includes(q) || firm.contact.toLowerCase().includes(q)
    const matchesStatus = statusFilter === "all" || firm.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const saveAssignment = async () => {
    if (!activeFirm) return
    if (!assignAgreementId.trim()) {
      setAssignError("Agreement ID is required.")
      return
    }
    setAssignError("")
    const res = await fetch("/api/admin/agreements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        firmId: activeFirm.id,
        agreementId: assignAgreementId.trim(),
        scope: assignScope,
        active: assignActive,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setAssignError(err.error || "Failed to save assignment.")
      return
    }
    const match = allAgreements.find((a) => a.id === assignAgreementId.trim())
    const newItem: FirmAgreement = {
      id: assignAgreementId.trim(),
      status: match?.status || "linked",
      title: match?.title || "Agreement",
      createdAt: match?.createdAt,
      creatorEmail: match?.creatorEmail,
      counterpartyEmail: match?.counterpartyEmail,
      scope: assignScope,
      active: assignActive,
    }
    setAgreements((prev) => [newItem, ...prev])
    setAssignAgreementId("")
    setAssignScope("legal_resolution")
    setAssignActive(true)
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
                <h1 className="text-2xl font-bold">Law Firms</h1>
                <p className="text-slate-400 text-sm">Manage partner firms, contacts, and engagements.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-slate-200 border-slate-700 hover:bg-slate-800"
                  onClick={loadFirms}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={startCreate}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Firm
                </Button>
              </div>
            </div>

            <Card className="bg-slate-900/80 border border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Partner Registry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <div className="flex flex-col md:flex-row gap-2">
                  <Input
                    placeholder="Search by name or contact..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-100"
                  />
                  <div className="flex gap-2 text-xs">
                    {["all", "active", "onboarding", "suspended"].map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`capitalize ${
                          statusFilter === status ? "bg-white text-black" : "border-slate-700 text-slate-200"
                        }`}
                        onClick={() => setStatusFilter(status as FirmStatus | "all")}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800 relative">
                  {loadingFirms && (
                    <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-sm text-slate-300">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-2" />
                      Loading firms...
                    </div>
                  )}
                  <table className="min-w-full text-left text-sm text-slate-200">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="px-3 py-2">Firm</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Region</th>
                        <th className="px-3 py-2">Matters</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFirms.map((firm) => (
                        <tr
                          key={firm.id}
                          className={`border-b border-slate-800/60 ${
                            selectedFirmId === firm.id ? "bg-slate-800/60" : ""
                          }`}
                        >
                          <td className="px-3 py-2 space-y-1">
                            <div className="font-semibold text-white">{firm.name}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="w-3 h-3" />
                              {firm.email}
                            </div>
                          </td>
                          <td className="px-3 py-2 space-y-1">
                            <div>{firm.contact}</div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Phone className="w-3 h-3" />
                              {firm.phone}
                            </div>
                          </td>
                          <td className="px-3 py-2">{firm.region}</td>
                          <td className="px-3 py-2">{firm.matters}</td>
                          <td className="px-3 py-2">
                            <Badge
                              className={
                                firm.status === "active"
                                  ? "bg-green-500/20 text-green-100 border border-green-600/50"
                                  : firm.status === "onboarding"
                                    ? "bg-amber-500/20 text-amber-100 border border-amber-600/50"
                                    : "bg-red-500/20 text-red-100 border border-red-600/50"
                              }
                            >
                              {firm.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-200 hover:text-white"
                              onClick={() => setSelectedFirmId(firm.id)}
                            >
                              Open
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-200 hover:text-white"
                              onClick={() => startEdit(firm)}
                            >
                              Edit
                            </Button>
                            {firm.status === "suspended" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-200 hover:text-white"
                                onClick={async () => {
                                  await fetch("/api/admin/lawfirms", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ id: firm.id, status: "active" }),
                                  })
                                  setFirms((prev) =>
                                    prev.map((f) => (f.id === firm.id ? { ...f, status: "active" } : f)),
                                  )
                                }}
                              >
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Activate
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-200 hover:text-white"
                                onClick={async () => {
                                  await fetch("/api/admin/lawfirms", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    credentials: "include",
                                    body: JSON.stringify({ id: firm.id, status: "suspended" }),
                                  })
                                  setFirms((prev) =>
                                    prev.map((f) => (f.id === firm.id ? { ...f, status: "suspended" } : f)),
                                  )
                                }}
                              >
                                <BadgeAlert className="w-3 h-3 mr-1" />
                                Suspend
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-300 hover:text-white"
                              disabled={deletingId === firm.id}
                              onClick={() => deleteFirm(firm.id)}
                            >
                              {deletingId === firm.id ? "Deleting..." : "Delete"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredFirms.length === 0 && (
                    <div className="p-4 text-xs text-slate-400">No firms match your filters.</div>
                  )}
                </div>

                {loadError && <p className="text-xs text-red-400">{loadError}</p>}
                <p className="text-xs text-slate-500">
                  Wired to API: /api/admin/lawfirms (GET, POST for upsert, PATCH for status). Replace the inline
                  actions with form dialogs as needed.
                </p>
              </CardContent>
            </Card>
            {activeFirm && (
              <Card className="bg-slate-900/80 border border-slate-800">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-white">{activeFirm.name}</CardTitle>
                    <p className="text-slate-400 text-sm">Firm profile & related operations</p>
                  </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    {["overview", "contacts", "interventions", "agreements", "ads"].map((tab) => (
                      <Button
                        key={tab}
                        size="sm"
                        variant="outline"
                        className={`capitalize ${
                          selectedTab === tab ? "bg-white text-black" : "border-slate-700 text-slate-200"
                        }`}
                        onClick={() => setSelectedTab(tab as any)}
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <DetailRow label="Contact" value={activeFirm.contact} />
                      <DetailRow label="Email" value={activeFirm.email} />
                      <DetailRow label="Phone" value={activeFirm.phone} />
                      <DetailRow label="Region" value={activeFirm.region} />
                      <DetailRow label="Matters" value={activeFirm.matters} />
                      <DetailRow label="Status" value={activeFirm.status} />
                      <p className="text-xs text-slate-500 md:col-span-2">
                        Use this space to attach contracts, compliance notes, and engagement SLAs.
                      </p>
                    </div>
                  )}

                  {selectedTab === "contacts" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {contactsLoading ? (
                          <p className="text-sm text-slate-400">Loading contacts...</p>
                        ) : (
                          contacts.map((c) => (
                            <div key={c.id} className="p-3 border border-slate-800 rounded-lg bg-slate-950/40">
                              <div className="font-semibold text-white">{c.name}</div>
                              <div className="text-xs text-slate-400">{c.role || "Counsel"}</div>
                              <div className="text-xs text-slate-400 mt-1">{c.email}</div>
                              {c.phone && <div className="text-xs text-slate-400">{c.phone}</div>}
                              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                                <span>Priority {c.priority ?? 1}</span>
                                {c.onCall ? <Badge className="bg-emerald-600">On-call</Badge> : null}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="text-blue-200 border-slate-800"
                                  onClick={() => setContactForm(c)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  className="text-red-200 border-slate-800"
                                  onClick={() => deleteContact(c.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-white text-sm">
                            {contactForm.id ? "Update contact" : "Add lawyer/contact"}
                          </h3>
                          {contactForm.id && (
                            <Button size="xs" variant="ghost" className="text-slate-300" onClick={() => setContactForm({})}>
                              Clear
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <Input
                            placeholder="Name"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={contactForm.name || ""}
                            onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                          />
                          <Input
                            placeholder="Email"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={contactForm.email || ""}
                            onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                          />
                          <Input
                            placeholder="Phone"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={contactForm.phone || ""}
                            onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                          />
                          <Input
                            placeholder="Role (Litigator, Partner...)"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={contactForm.role || ""}
                            onChange={(e) => setContactForm((p) => ({ ...p, role: e.target.value }))}
                          />
                          <Input
                            type="number"
                            placeholder="Priority"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={contactForm.priority ?? ""}
                            onChange={(e) => setContactForm((p) => ({ ...p, priority: Number(e.target.value) }))}
                          />
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              id="onCall"
                              type="checkbox"
                              checked={!!contactForm.onCall}
                              onChange={(e) => setContactForm((p) => ({ ...p, onCall: e.target.checked }))}
                              className="accent-emerald-500"
                            />
                            <Label htmlFor="onCall" className="text-slate-300">
                              On-call / emergency
                            </Label>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white"
                          onClick={saveContact}
                        >
                          {contactForm.id ? "Update contact" : "Save contact"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedTab === "interventions" && (
                    <div className="space-y-3">
                      {interventionsLoading ? (
                        <p className="text-sm text-slate-400">Loading interventions...</p>
                      ) : interventions.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {interventions.map((item) => (
                            <div key={item.id} className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">{item.agreementId || "No agreement id"}</span>
                                <Badge className="bg-white text-black">{item.status}</Badge>
                              </div>
                              <p className="text-xs text-slate-400">
                                Triggered by {item.triggeredBy || "system"} · {item.triggeredAt || ""}
                              </p>
                              {item.notes && <p className="text-sm text-slate-200">{item.notes}</p>}
                              <div className="space-y-1 text-xs text-slate-300">
                                <p>Assign contact</p>
                                <select
                                  value={item.assignedContactId || ""}
                                  onChange={async (e) => {
                                    const newId = e.target.value || null
                                    await fetch("/api/admin/lawfirms/interventions", {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      credentials: "include",
                                      body: JSON.stringify({ id: item.id, status: item.status, assignedContactId: newId }),
                                    })
                                    setInterventions((prev) =>
                                      prev.map((i) =>
                                        i.id === item.id
                                          ? {
                                              ...i,
                                              assignedContactId: newId,
                                              contactName: contacts.find((c) => c.id === newId)?.name || i.contactName,
                                            }
                                          : i,
                                      ),
                                    )
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2 py-1"
                                >
                                  <option value="">Unassigned</option>
                                  {contacts.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} {c.role ? `(${c.role})` : ""}
                                    </option>
                                  ))}
                                </select>
                                {item.contactName && <p className="text-slate-400">Current: {item.contactName}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No interventions yet.</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Interventions are created automatically when legal resolution workflows trigger. You can also
                        seed manual records via the API /api/admin/lawfirms/interventions.
                      </p>
                    </div>
                  )}

                  {selectedTab === "ads" && (
                    <div className="space-y-4">
                      <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 space-y-3">
                        <h3 className="font-semibold text-white text-sm">Create sponsored slot</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Title"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={adForm.title || ""}
                            onChange={(e) => setAdForm((p) => ({ ...p, title: e.target.value }))}
                          />
                          <Input
                            placeholder="CTA text"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={adForm.ctaText || ""}
                            onChange={(e) => setAdForm((p) => ({ ...p, ctaText: e.target.value }))}
                          />
                          <Input
                            placeholder="CTA URL"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={adForm.ctaUrl || ""}
                            onChange={(e) => setAdForm((p) => ({ ...p, ctaUrl: e.target.value }))}
                          />
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              id="ad-active"
                              type="checkbox"
                              checked={adForm.active ?? true}
                              onChange={(e) => setAdForm((p) => ({ ...p, active: e.target.checked }))}
                              className="accent-emerald-500"
                            />
                            <Label htmlFor="ad-active" className="text-slate-300">
                              Active
                            </Label>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Ad copy"
                          className="bg-slate-900 border-slate-700 text-slate-100"
                          value={adForm.body || ""}
                          onChange={(e) => setAdForm((p) => ({ ...p, body: e.target.value }))}
                        />
                        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" size="sm" onClick={saveAd}>
                          Save placement
                        </Button>
                      </div>

                      {adsLoading ? (
                        <p className="text-sm text-slate-400">Loading ads...</p>
                      ) : ads.length ? (
                        <div className="space-y-3">
                          {ads.map((ad) => (
                            <div key={ad.id} className="p-4 border border-slate-800 rounded-lg bg-slate-950/40 space-y-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-white">{ad.title}</div>
                                  <div className="text-xs text-slate-400">{ad.ctaText || "CTA not set"}</div>
                                </div>
                                <Badge className={ad.active ? "bg-emerald-600" : "bg-slate-700"}>
                                  {ad.active ? "Active" : "Paused"}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-200">{ad.body}</p>
                              {ad.ctaUrl && (
                                <a className="text-xs text-blue-300" href={ad.ctaUrl} target="_blank" rel="noreferrer">
                                  {ad.ctaUrl}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No ads yet.</p>
                      )}
                    </div>
                  )}

                  {selectedTab === "agreements" && (
                    <div className="space-y-3">
                      <div className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 space-y-3">
                        <h3 className="font-semibold text-white text-sm">Assign firm to agreement</h3>
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {allAgreementsLoading
                              ? "Loading agreements..."
                              : `Available agreements: ${allAgreements.length}`}
                          </span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-slate-200 border-slate-700"
                            onClick={loadAllAgreements}
                          >
                            Refresh list
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-1">
                            <select
                              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded px-2 py-2"
                              value={assignAgreementId}
                              onChange={(e) => setAssignAgreementId(e.target.value)}
                            >
                              <option value="">Select agreement...</option>
                              {allAgreements.map((ag) => (
                                <option key={ag.id} value={ag.id}>
                                  {(ag.title || ag.id) + " • " + (ag.status || "unknown")}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Input
                            placeholder="Scope (e.g. legal_resolution)"
                            className="bg-slate-900 border-slate-700 text-slate-100"
                            value={assignScope}
                            onChange={(e) => setAssignScope(e.target.value)}
                          />
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              id="assign-active"
                              type="checkbox"
                              checked={assignActive}
                              onChange={(e) => setAssignActive(e.target.checked)}
                              className="accent-emerald-500"
                            />
                            <Label htmlFor="assign-active" className="text-slate-300">
                              Active
                            </Label>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          <Input
                            readOnly
                            placeholder="Title"
                            value={selectedAgreement?.title || ""}
                            className="bg-slate-900 border-slate-700 text-slate-300"
                          />
                          <Input
                            readOnly
                            placeholder="Creator"
                            value={selectedAgreement?.creatorEmail || ""}
                            className="bg-slate-900 border-slate-700 text-slate-300"
                          />
                          <Input
                            readOnly
                            placeholder="Counterparty"
                            value={selectedAgreement?.counterpartyEmail || ""}
                            className="bg-slate-900 border-slate-700 text-slate-300"
                          />
                        </div>
                        {allAgreementsLoading && (
                          <p className="text-xs text-slate-400">Loading agreements list...</p>
                        )}
                        {assignError && <p className="text-xs text-red-300">{assignError}</p>}
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={saveAssignment}>
                          Link agreement
                        </Button>
                      </div>

                      {agreementsLoading ? (
                        <p className="text-sm text-slate-400">Loading agreements...</p>
                      ) : agreements.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {agreements.map((ag) => (
                            <div
                              key={ag.id}
                              className="p-4 border border-slate-800 rounded-lg bg-slate-950/50 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-semibold text-white truncate">{ag.title || "Agreement"}</p>
                                  <p className="text-xs text-slate-400 truncate">{ag.id}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge className="bg-white text-black">{(ag.status || "unknown").replace("_", " ")}</Badge>
                                  <Badge className={ag.active ? "bg-emerald-600" : "bg-slate-700"}>
                                    {ag.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-slate-300">Scope: {ag.scope || "legal_resolution"}</p>
                              <p className="text-xs text-slate-400">
                                {ag.createdAt
                                  ? new Date(ag.createdAt).toLocaleString("en-GB")
                                  : "Created date unavailable"}
                              </p>
                              <div className="text-xs text-slate-400 space-y-1">
                                {ag.creatorEmail && <p>Creator: {ag.creatorEmail}</p>}
                                {ag.counterpartyEmail && <p>Counterparty: {ag.counterpartyEmail}</p>}
                              </div>
                              {ag.assignmentId && (
                                <div className="flex gap-2 text-xs">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-blue-200 border-blue-500/40 hover:bg-blue-500/10"
                                    onClick={async () => {
                                      await fetch("/api/admin/agreements", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({
                                          id: ag.assignmentId,
                                          active: !ag.active,
                                        }),
                                      })
                                      setAgreements((prev) =>
                                        prev.map((item) =>
                                          item.assignmentId === ag.assignmentId ? { ...item, active: !ag.active } : item,
                                        ),
                                      )
                                    }}
                                  >
                                    Toggle
                                  </Button>
                                  <Input
                                    value={ag.scope || ""}
                                    onChange={(e) =>
                                      setAgreements((prev) =>
                                        prev.map((item) =>
                                          item.assignmentId === ag.assignmentId ? { ...item, scope: e.target.value } : item,
                                        ),
                                      )
                                    }
                                    onBlur={async (e) => {
                                      await fetch("/api/admin/agreements", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        credentials: "include",
                                        body: JSON.stringify({
                                          id: ag.assignmentId,
                                          scope: e.target.value,
                                        }),
                                      })
                                    }}
                                    className="bg-slate-900 border-slate-700 text-slate-100"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          No linked agreements yet. Hook this to your agreements API for richer data.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeFirm && (
              <Card className="bg-slate-900/70 border border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Services & Offers</CardTitle>
                  <p className="text-slate-400 text-sm">
                    Commercial slots to showcase what this firm can do for your agreements.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        title: "Rapid dispute triage",
                        desc: "24h review of dispute files with next-step memo.",
                        tag: "Fixed fee",
                      },
                      {
                        title: "Completion readiness check",
                        desc: "Validate signatures, evidence, and completion blockers.",
                        tag: "Package",
                      },
                      {
                        title: "On-call counsel",
                        desc: "Assign an on-call litigator for escalations and SLA breaches.",
                        tag: "Subscription",
                      },
                    ].map((svc) => (
                      <div key={svc.title} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white">{svc.title}</p>
                          <Badge className="bg-white text-black text-xs">{svc.tag}</Badge>
                        </div>
                        <p className="text-sm text-slate-300">{svc.desc}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-blue-200 border-slate-700">
                            View details
                          </Button>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                            Request
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="bg-slate-900 text-white border border-slate-800">
          <DialogHeader>
            <DialogTitle>{formState.id ? "Edit Law Firm" : "Add Law Firm"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Name</Label>
                <Input
                  value={formState.name || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, name: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Contact</Label>
                <Input
                  value={formState.contact || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, contact: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={formState.email || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, email: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formState.phone || ""}
                  onChange={(e) => setFormState((p) => ({ ...p, phone: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Region</Label>
                <Input
                  value={formState.region || "UK"}
                  onChange={(e) => setFormState((p) => ({ ...p, region: e.target.value }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
              <div>
                <Label className="text-slate-300">Matters</Label>
                <Input
                  type="number"
                  value={formState.matters ?? 0}
                  onChange={(e) => setFormState((p) => ({ ...p, matters: Number(e.target.value) }))}
                  className="bg-slate-900 border-slate-700 text-slate-100"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Status</Label>
              <div className="flex gap-2 flex-wrap">
                {["active", "onboarding", "suspended"].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`capitalize ${
                      formState.status === status ? "bg-white text-black" : "border-slate-700 text-slate-200"
                    }`}
                    onClick={() => setFormState((p) => ({ ...p, status: status as FirmStatus }))}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
            {formError && <p className="text-xs text-red-300">{formError}</p>}
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenForm(false)} className="text-slate-200">
              Cancel
            </Button>
            <Button onClick={saveFirm} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-start gap-3 text-sm text-slate-200">
      <span className="text-slate-400 w-28 shrink-0">{label}</span>
      <Separator orientation="vertical" className="h-5 bg-slate-800" />
      <span className="break-words">{value ?? "—"}</span>
    </div>
  )
}
