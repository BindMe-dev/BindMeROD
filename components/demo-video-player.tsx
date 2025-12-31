"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Activity,
  CheckCircle2,
  FastForward,
  FileText,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

type ClipField = {
  label: string
  value: string
  hint?: string
}

type Clip = {
  id: string
  title: string
  subtitle: string
  accent: string
  badge: string
  fields: ClipField[]
  events: string[]
  callout: string
}

const clips: Clip[] = [
  {
    id: "draft",
    title: "Draft in seconds",
    subtitle: "Template + AI clauses, no typing",
    accent: "from-blue-500 via-cyan-500 to-emerald-400",
    badge: "Smart drafting",
    fields: [
      { label: "Title", value: "Product Launch Accountability Pact" },
      { label: "Type", value: "Recurring (weekly checkpoints)" },
      { label: "Jurisdiction", value: "United Kingdom · NDA" },
      { label: "Priority", value: "High · Audit ready" },
    ],
    events: ["Template picked", "Clauses injected", "Dates aligned"],
    callout: "BindMe pre-fills legal boilerplate and dates automatically.",
  },
  {
    id: "parties",
    title: "Add parties & roles",
    subtitle: "Counterparty, witness, counsel in one pass",
    accent: "from-purple-500 via-pink-500 to-red-400",
    badge: "Collaboration",
    fields: [
      { label: "Counterparty", value: "Noel Carter · noel@acme.com" },
      { label: "Witness", value: "Priya Mehta · priya@legal.io" },
      { label: "Counsel", value: "Review attached · auto-tracked" },
      { label: "Access", value: "Secure links + role-based signing" },
    ],
    events: ["Roles assigned", "Sign order set", "Invites delivered"],
    callout: "Roles, signing order, and secure links are auto-orchestrated.",
  },
  {
    id: "sign",
    title: "Sign & verify",
    subtitle: "OTP, ID, IP/location captured",
    accent: "from-emerald-500 via-green-400 to-lime-300",
    badge: "Verification",
    fields: [
      { label: "Creator signature", value: "Signed · IP 81.2.44.10 · London" },
      { label: "Counterparty", value: "Pending · SMS OTP sent" },
      { label: "Witness", value: "Verified · GovID matched" },
      { label: "Audit trail", value: "12 events · tamper-sealed" },
    ],
    events: ["OTP passed", "ID verified", "Signature captured"],
    callout: "Every signature includes OTP, ID match, IP, and geolocation.",
  },
  {
    id: "resolve",
    title: "Evidence & resolution",
    subtitle: "Proof-of-performance to legal packet",
    accent: "from-amber-400 via-orange-500 to-rose-500",
    badge: "Resolution",
    fields: [
      { label: "Evidence", value: "PDF + photo + geo-stamp attached" },
      { label: "Milestone", value: "Week 3 deliverable accepted" },
      { label: "Packet", value: "Exported PDF with signatures" },
      { label: "Outcome", value: "Resolved amicably · ready for court" },
    ],
    events: ["Evidence logged", "Counter-signed", "Packet built"],
    callout: "One click exports a court-ready packet with the full timeline.",
  },
]

export function DemoVideoPlayer() {
  const [active, setActive] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [typedValues, setTypedValues] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)
  const [finished, setFinished] = useState(false)
  const advanceTimeout = useRef<NodeJS.Timeout | null>(null)

  const clip = useMemo(() => clips[active], [active])

  useEffect(() => {
    // reset typing state on clip change
    const reset: Record<string, string> = {}
    clip.fields.forEach((f) => (reset[f.label] = ""))
    setTypedValues(reset)
    setProgress(0)
    setFinished(false)

    if (!isPlaying) return

    const maxLen = Math.max(...clip.fields.map((f) => f.value.length))
    let tick = 0
    const interval = setInterval(() => {
      tick += 1
      const typed = Object.fromEntries(
        clip.fields.map((f) => {
          const len = Math.min(f.value.length, tick * 2)
          return [f.label, f.value.slice(0, len)]
        }),
      ) as Record<string, string>
      setTypedValues(typed)
      setProgress(Math.min(100, Math.round((tick * 2 * 100) / (maxLen + 6))))
      if (tick * 2 >= maxLen) {
        clearInterval(interval)
        setFinished(true)
      }
    }, 70)

    return () => clearInterval(interval)
  }, [clip, isPlaying])

  useEffect(() => {
    if (!isPlaying || !finished) return
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    advanceTimeout.current = setTimeout(() => {
      setActive((prev) => (prev + 1) % clips.length)
    }, 1100)
    return () => {
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current)
    }
  }, [finished, isPlaying])

  const togglePlay = () => {
    setIsPlaying((prev) => !prev)
    setFinished(false)
  }

  const jumpTo = (index: number) => {
    setActive(index)
    setIsPlaying(true)
    setFinished(false)
  }

  return (
    <Card className="bg-slate-950 border-slate-900">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-white text-xl">Interactive demo</CardTitle>
              <p className="text-sm text-slate-400">Watch the agreement flow fill itself like a quick video.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/20 text-red-200 border-red-500/30">REC</Badge>
            <Button size="sm" variant="outline" onClick={togglePlay} className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800">
              {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {clips.map((item, index) => (
            <button
              key={item.id}
              onClick={() => jumpTo(index)}
              className={cn(
                "rounded-full px-3 py-1 text-xs border transition-colors",
                index === active ? "bg-slate-800 text-white border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700",
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-900 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-2xl shadow-blue-900/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(168,85,247,0.08),transparent_30%)]" />
          <div className="relative p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-11 h-11 rounded-lg bg-gradient-to-r text-white flex items-center justify-center shadow-lg", clip.accent)}>
                  {clip.id === "draft" && <FileText className="w-5 h-5" />}
                  {clip.id === "parties" && <Users className="w-5 h-5" />}
                  {clip.id === "sign" && <ShieldCheck className="w-5 h-5" />}
                  {clip.id === "resolve" && <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-white font-semibold">{clip.title}</p>
                  <p className="text-sm text-slate-400">{clip.subtitle}</p>
                </div>
              </div>
              <Badge className="bg-slate-900 text-slate-200 border-slate-800">{clip.badge}</Badge>
            </div>

            <Progress value={progress} className="h-2 bg-slate-900" />

            <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] gap-4">
              <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4 space-y-3 shadow-inner shadow-blue-900/10">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Autofilling fields</span>
                  <span>{isPlaying ? "Playing" : "Paused"}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {clip.fields.map((field) => {
                    const typed = typedValues[field.label] ?? ""
                    const showCaret = isPlaying && typed.length < field.value.length
                    return (
                      <div key={field.label} className="rounded-lg border border-slate-900 bg-slate-900/60 p-3 space-y-1">
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">{field.label}</p>
                        <p className="text-white font-semibold flex items-center gap-2 min-h-[24px]">
                          {typed || <span className="text-slate-600">···</span>}
                          {showCaret && <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse rounded-sm" />}
                        </p>
                        {field.hint && <p className="text-xs text-slate-500">{field.hint}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Live events</span>
                </div>
                <Separator className="bg-slate-900" />
                <div className="space-y-2">
                  {clip.events.map((event) => (
                    <div key={event} className="flex items-center gap-2 text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm">{event}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-slate-900 bg-slate-900/60 p-3 flex items-center justify-between">
                  <p className="text-sm text-slate-200">{clip.callout}</p>
                  <Badge className="bg-slate-800 text-slate-200 border-slate-700">Auto-captured</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated video · Tap next to skip ahead</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                  onClick={() => jumpTo((active - 1 + clips.length) % clips.length)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-800 bg-slate-900 text-white hover:bg-slate-800"
                  onClick={() => jumpTo((active + 1) % clips.length)}
                >
                  Next
                  <FastForward className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
