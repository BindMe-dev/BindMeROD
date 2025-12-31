"use client"

import { useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { NotificationBell } from "@/components/notification-bell"
import { AdminLink } from "@/components/admin-link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Shield, Search, Calendar, BarChart3, Settings, LogOut, Gift, Trophy, Users } from "lucide-react"

export function GlobalTopNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || ""

  const authPages = ["/login", "/forgot-password", "/reset-password", "/"]
  const isLanding = pathname === "/" || pathname === "/home" || pathname === "/index"
  const isAuthPage = authPages.some((p) => pathname === p || pathname.startsWith("/signup")) || isLanding
  if (!user || isAuthPage) return null

  const subtitle = useMemo(() => {
    return `Welcome back, ${user.name || user.email || "there"}`
  }, [user.name, user.email])

  const handleSignOut = () => {
    signOut()
    router.push("/login")
  }

  return (
      <div className="fixed top-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800 shadow-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-4 sm:gap-6">
          {/* Logo & Brand - Responsive */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 sm:gap-3 min-w-0 focus:outline-none"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 text-left hidden sm:block">
                <div className="text-xl font-bold leading-tight text-white truncate">BindMe</div>
                <div className="text-sm text-slate-400 truncate">{subtitle}</div>
              </div>
            </button>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-3">
            <div className="scale-110">
              <NotificationBell />
            </div>
            <AdminLink />
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/search")}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/referrals")}
              title="Referrals - Earn Rewards"
            >
              <Gift className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/achievements")}
              title="Achievements"
            >
              <Trophy className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/community")}
              title="Community"
            >
              <Users className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/calendar")}
              title="Calendar"
            >
              <Calendar className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/statistics")}
              title="Statistics"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={() => router.push("/settings")}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-11 h-11"
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Navigation - Only Notification & Search */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-200 hover:text-white hover:bg-slate-800 w-9 h-9"
              onClick={() => router.push("/search")}
              title="Search"
            >
              <Search className="w-4 h-4" />
            </Button>
            <div className="scale-100">
              <NotificationBell />
            </div>
          </div>
        </div>
      </div>
  )
}
