"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { ShieldCheck } from "lucide-react"

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.split("@")[0] || ""
  if (!source) return "?"
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function GlobalUserBar() {
  const { user } = useAuth()
  const pathname = usePathname() || ''

  // Hide on auth pages
  const authPages = ['/login', '/forgot-password', '/reset-password', '/']
  if (authPages.includes(pathname) || !user) return null

  const initials = useMemo(() => getInitials(user.name, user.email), [user.name, user.email])
  const label = `${user.name} (${user.email})`

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border shadow-lg bg-white/95 backdrop-blur px-3 py-2 transition-all duration-200 hover:px-4 hover:shadow-xl">
        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
          {initials}
        </div>
        <div className="max-w-[220px] text-sm leading-tight text-muted-foreground">
          <div className="font-semibold text-foreground truncate flex items-center gap-1">
            {user.name || "Guest"}
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-[11px] font-semibold px-2 py-0.5">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <div className="truncate">{user.email || label}</div>
        </div>
      </div>
    </div>
  )
}
