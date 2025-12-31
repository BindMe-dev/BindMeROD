"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileText,
  Gavel,
  Handshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

type DemoField = {
  label: string
  value: string
  status?: "highlight" | "muted"
}

type DemoStep = {
  title: string
  subtitle: string
  icon: React.ReactNode
  accent: string
  status: string
  progress: number
  fields: DemoField[]
  timeline: string[]
  callout: string
}

const steps: DemoStep[] = [
  {
    title: "Draft the agreement",
    subtitle: "Start from a smart template",
    icon: <FileText className="w-5 h-5" />,
    accent: "from-blue-500 to-cyan-500",
    status: "Drafting",
    progress: 25,
    callout: "Template auto-fills key clauses and dates.",
    fields: [
      { label: "Title", value: "Product Launch Accountability" },
      { label: "Type", value: "Recurring · Weekly", status: "highlight" },
      { label: "Priority", value: "High (legal ready)", status: "highlight" },
      { label: "Jurisdiction", value: "United Kingdom" },
    ],
    timeline: ["Select template", "Set scope", "Pick jurisdiction"],
  },
  {
    title: "Add parties and roles",
    subtitle: "Counterparties, witnesses, counsel",
    icon: <Users className="w-5 h-5" />,
    accent: "from-purple-500 to-pink-500",
    status: "Collaborators",
    progress: 45,
    callout: "Invite counterparties with signing roles and guardrails.",
    fields: [
      { label: "Creator", value: "Ava Lawson · ava@bindme.co" },
      { label: "Counterparty", value: "Noel Carter · noel@acme.com", status: "highlight" },
      { label: "Witness", value: "Priya Mehta · priya@legal.io" },
      { label: "Counsel", value: "In-app review attached" },
    ],
    timeline: ["Assign roles", "Set signing order", "Share securely"],
  },
  {
    title: "Sign & verify",
    subtitle: "Identity, intent, audit-ready",
    icon: <ShieldCheck className="w-5 h-5" />,
    accent: "from-emerald-500 to-green-400",
    status: "Signatures",
    progress: 65,
    callout: "KYC + IP/location stamps with every signature.",
    fields: [
      { label: "Creator signature", value: "Signed · IP 81.2.44.10", status: "highlight" },
      { label: "Counterparty", value: "Pending · SMS OTP sent" },
      { label: "Witness", value: "Verified · GovID match", status: "highlight" },
      { label: "Audit trail", value: "9 events captured" },
    ],
    timeline: ["ID verified", "OTP delivered", "Signature captured"],
  },
  {
    title: "Monitor & enforce",
    subtitle: "Reminders, evidence, milestones",
    icon: <Sparkles className="w-5 h-5" />,
    accent: "from-amber-400 to-orange-500",
    status: "In-flight",
    progress: 82,
    callout: "Proof-of-performance logged with attachments and location.",
    fields: [
      { label: "Milestone", value: "Weekly deliverable accepted" },
      { label: "Evidence", value: "PDF + photo + geo-stamp", status: "highlight" },
      { label: "Notifications", value: "Reminders to both parties" },
      { label: "Risk", value: "Low · All deadlines on track" },
    ],
    timeline: ["Reminders sent", "Evidence uploaded", "Counter-signed"],
  },
  {
    title: "Resolve legally",
    subtitle: "Resolution packet auto-built",
    icon: <Gavel className="w-5 h-5" />,
    accent: "from-blue-600 to-indigo-500",
    status: "Resolution",
    progress: 100,
    callout: "Export-ready legal packet with signatures and timeline.",
    fields: [
      { label: "Outcome", value: "Resolved amicably" },
      { label: "Agreement PDF", value: "Stamped & sealed", status: "highlight" },
      { label: "Case bundle", value: "Evidence + IP/location logs" },
      { label: "Next action", value: "Optional legal review" },
    ],
    timeline: ["Resolution drafted", "Packet assembled", "Shared with parties"],
  },
]

export function DemoWalkthrough() {
  const [activeStep, setActiveStep] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    if (!autoplay) return
    const id = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3600)
    return () => clearInterval(id)
  }, [autoplay])

  const step = useMemo(() => steps[activeStep], [activeStep])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Interactive demo</p>
            <p className="text-lg font-semibold text-white">From drafting to legal resolution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-800 text-slate-200 border-slate-700">Autoplay</Badge>
          <Button size="sm" variant="outline" onClick={() => setAutoplay((v) => !v)} className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800">
            {autoplay ? "Pause" : "Play"} demo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          {steps.map((item, index) => {
            const isActive = index === activeStep
            return (
              <button
                key={item.title}
                onClick={() => {
                  setActiveStep(index)
                  setAutoplay(false)
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all border border-transparent group",
                  isActive ? "bg-slate-800/80 border-slate-700 shadow-lg shadow-blue-900/30" : "hover:bg-slate-800/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-r text-white flex items-center justify-center", item.accent)}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.subtitle}</p>
                  </div>
                  <ArrowRight className={cn("w-4 h-4 text-slate-400 transition-transform", isActive && "translate-x-1 text-white")} />
                </div>
              </button>
            )
          })}
        </div>

        <Card className="bg-slate-900/70 border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className={cn("inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r text-white shadow-md", step.accent)}>
                    {step.icon}
                  </span>
                  {step.title}
                </CardTitle>
                <p className="text-slate-400">{step.subtitle}</p>
              </div>
              <Badge className="bg-slate-800 text-slate-100 border-slate-700">{step.status}</Badge>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Progress</span>
                <span className="text-white font-medium">{step.progress}%</span>
              </div>
              <Progress value={step.progress} className="h-2 bg-slate-800" />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              {step.fields.map((field) => (
                <div
                  key={field.label}
                  className={cn(
                    "p-3 rounded-lg border border-slate-800 bg-slate-900/60",
                    field.status === "highlight" && "border-emerald-400/50 bg-emerald-500/5 shadow-lg shadow-emerald-900/20"
                  )}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">{field.label}</p>
                  <p className="text-white font-semibold mt-1 flex items-center gap-2">
                    {field.status === "highlight" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span>Live timeline</span>
              </div>
              <Separator className="bg-slate-800" />
              <div className="flex flex-wrap gap-2">
                {step.timeline.map((item) => (
                  <Badge key={item} variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="flex items-center gap-2 text-slate-200">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm">{step.callout}</span>
              </div>
              <Button size="sm" variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                Preview PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
