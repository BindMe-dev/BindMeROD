"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Briefcase, RefreshCw, Plus, Filter, CheckCircle2, Clock, AlertCircle } from "lucide-react"

type IdeaStatus = "open" | "in_progress" | "done"
type IdeaTag = "idea" | "risk" | "ops" | "comms" | "product" | "flow"

interface Idea {
  id: string
  title: string
  detail: string
  status: IdeaStatus
  tag: IdeaTag
  createdAt: string
}

export default function AdminStrategyPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [formTitle, setFormTitle] = useState("")
  const [formDetail, setFormDetail] = useState("")
  const [formTag, setFormTag] = useState<IdeaTag>("idea")
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all")
  const [tagFilter, setTagFilter] = useState<"all" | IdeaTag>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
        const cached = typeof window !== "undefined" ? localStorage.getItem("admin-strategy-ideas") : null
        if (cached) {
          setIdeas(JSON.parse(cached))
        } else {
          const seed: Idea[] = [
            {
              id: crypto.randomUUID(),
              title: "Dispute flow v2",
              detail: "Draft iterative offer/counter-offer flow with evidence uploads and escalation rules.",
              status: "open",
              tag: "flow",
              createdAt: new Date().toISOString(),
            },
            {
              id: crypto.randomUUID(),
              title: "Notifications overhaul",
              detail: "Urgent vs normal categories, per-step emails for agreements and verification decisions.",
              status: "in_progress",
              tag: "comms",
              createdAt: new Date().toISOString(),
            },
          ]
          setIdeas(seed)
          localStorage.setItem("admin-strategy-ideas", JSON.stringify(seed))
        }
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  useEffect(() => {
    if (ideas.length && typeof window !== "undefined") {
      localStorage.setItem("admin-strategy-ideas", JSON.stringify(ideas))
    }
  }, [ideas])

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter
      const matchesTag = tagFilter === "all" || idea.tag === tagFilter
      const q = search.toLowerCase()
      const matchesSearch = !q || idea.title.toLowerCase().includes(q) || idea.detail.toLowerCase().includes(q)
      return matchesStatus && matchesTag && matchesSearch
    })
  }, [ideas, statusFilter, tagFilter, search])

  const addIdea = () => {
    if (!formTitle.trim()) return
    const next: Idea = {
      id: crypto.randomUUID(),
      title: formTitle.trim(),
      detail: formDetail.trim() || "Needs details",
      tag: formTag,
      status: "open",
      createdAt: new Date().toISOString(),
    }
    setIdeas((prev) => [next, ...prev])
    setFormTitle("")
    setFormDetail("")
    setFormTag("idea")
  }

  const updateStatus = (id: string, status: IdeaStatus) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)))
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
                <h1 className="text-2xl font-bold">Strategy</h1>
                <p className="text-slate-400 text-sm">Tramline for ideas, questions, and dev threads.</p>
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
              <CardHeader className="flex flex-col gap-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Strategy & Ops Tramline
                </CardTitle>
                <p className="text-slate-400 text-sm">Capture thoughts to work on with Vic.</p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-300">
                <div className="grid gap-3 md:grid-cols-3 items-start">
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Idea / question / dev thread..."
                    className="bg-slate-900 border-slate-700 text-slate-100 md:col-span-2"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {["idea", "risk", "ops", "comms", "product", "flow"].map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`capitalize ${
                          formTag === tag ? "bg-white text-black" : "border-slate-700 text-slate-200"
                        }`}
                        onClick={() => setFormTag(tag as IdeaTag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    value={formDetail}
                    onChange={(e) => setFormDetail(e.target.value)}
                    rows={3}
                    placeholder="Details, context, links..."
                    className="bg-slate-900 border-slate-700 text-slate-100 md:col-span-3"
                  />
                  <div className="md:col-span-3 flex justify-end">
                    <Button
                      onClick={addIdea}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                      disabled={!formTitle.trim()}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add entry
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {["all", "open", "in_progress", "done"].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`capitalize ${
                        statusFilter === status ? "bg-white text-black" : "border-slate-700 text-slate-200"
                      }`}
                      onClick={() => setStatusFilter(status as IdeaStatus | "all")}
                    >
                      {status.replace("_", " ")}
                    </Button>
                  ))}
                  {["all", "idea", "risk", "ops", "comms", "product", "flow"].map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      className={`capitalize ${
                        tagFilter === tag ? "bg-white text-black" : "border-slate-700 text-slate-200"
                      }`}
                      onClick={() => setTagFilter(tag as IdeaTag | "all")}
                    >
                      {tag === "all" ? "All tags" : tag}
                    </Button>
                  ))}
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="bg-slate-900 border-slate-700 text-slate-100 w-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-slate-200 border-slate-700"
                    onClick={() => {
                      setSearch("")
                      setStatusFilter("all")
                      setTagFilter("all")
                    }}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Clear filters
                  </Button>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-900/60 divide-y divide-slate-800">
                  {filteredIdeas.length === 0 && (
                    <div className="p-4 text-slate-400 text-sm">No entries yet. Add your first idea above.</div>
                  )}
                  {filteredIdeas.map((idea) => (
                    <div key={idea.id} className="p-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{idea.title}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(idea.createdAt).toLocaleString()} • {idea.tag}
                          </p>
                        </div>
                        <Badge
                          className={
                            idea.status === "done"
                              ? "bg-green-500/20 text-green-100 border border-green-600/40"
                              : idea.status === "in_progress"
                                ? "bg-blue-500/20 text-blue-100 border border-blue-600/40"
                                : "bg-amber-500/20 text-amber-100 border border-amber-600/40"
                          }
                        >
                          {idea.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-slate-200 text-sm whitespace-pre-wrap">{idea.detail}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-200 border-green-500/40 hover:bg-green-500/10"
                          onClick={() => updateStatus(idea.id, "done")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Mark done
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-200 border-blue-500/40 hover:bg-blue-500/10"
                          onClick={() => updateStatus(idea.id, "in_progress")}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          In progress
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-200 border-amber-500/40 hover:bg-amber-500/10"
                          onClick={() => updateStatus(idea.id, "open")}
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Re-open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
