"use client"

import { Loader2, FileText } from "lucide-react"

export default function AgreementLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="text-lg font-semibold">Loading agreement</p>
            <p className="text-slate-400 text-sm">Fetching details, signatures, and actions…</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-2 text-slate-200">
            <FileText className="w-4 h-4 text-blue-300" />
            Details
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-2 text-slate-200">
            <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />
            Smart actions
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-2 text-slate-200">
            <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
            Participants
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center gap-2 text-slate-200">
            <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
            Signatures
          </div>
        </div>
      </div>
    </div>
  )
}
