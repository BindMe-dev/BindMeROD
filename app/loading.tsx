"use client"

import { Loader2 } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/70 flex items-center justify-center border border-slate-700">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
        </div>
        <div>
          <p className="text-lg font-semibold">Loading experience</p>
          <p className="text-slate-400 text-sm">Bringing your content into view…</p>
        </div>
      </div>
    </div>
  )
}
