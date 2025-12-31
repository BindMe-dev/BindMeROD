"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  UserCog,
  FileSearch,
  FileText,
  HandCoins,
  Briefcase,
  Building2,
  Megaphone,
  Settings,
  Shield,
  Sliders,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { id: "users", label: "Users", icon: UserCog, href: "/admin/users" },
  { id: "verifications", label: "Verifications", icon: FileSearch, href: "/admin/verifications" },
  { id: "agreements", label: "Agreements", icon: FileText, href: "/admin/agreements" },
  { id: "action-permissions", label: "Action Permissions", icon: Sliders, href: "/admin/action-permissions" },
  { id: "expenses", label: "Expenses", icon: HandCoins, href: "/admin/expenses" },
  { id: "strategy", label: "Strategy", icon: Briefcase, href: "/admin/strategy" },
  { id: "lawfirms", label: "Law Firms", icon: Building2, href: "/admin/lawfirms" },
  { id: "marketing", label: "Marketing", icon: Megaphone, href: "/admin/marketing" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
]

export function AdminSidebar() {
  const pathname = usePathname() || "/admin"
  const router = useRouter()

  const activeId = useMemo(() => {
    if (pathname === "/admin") return "overview"
    const match = navItems.find((item) => item.href !== "/admin" && pathname.startsWith(item.href))
    return match?.id || "overview"
  }, [pathname])

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20 rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1 shadow-lg">
        <div className="flex items-center justify-between px-2 pb-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Admin</p>
            <p className="text-sm text-white font-semibold">Control Center</p>
          </div>
          <Badge className="bg-slate-800 text-slate-200 border border-slate-700 gap-1">
            <Shield className="w-3 h-3" />
            Admin
          </Badge>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-blue-900/50 border border-blue-700 text-white"
                  : "text-slate-200 hover:text-white hover:bg-slate-800 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

export const adminNavItems = navItems
