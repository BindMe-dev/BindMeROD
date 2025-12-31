"use client"

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
  MoreHorizontal,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin" },
  { id: "users", label: "Users", icon: UserCog, href: "/admin/users" },
  { id: "verifications", label: "Verify", icon: FileSearch, href: "/admin/verifications" },
  { id: "agreements", label: "Agreements", icon: FileText, href: "/admin/agreements" },
]

const moreItems = [
  { id: "expenses", label: "Expenses", icon: HandCoins, href: "/admin/expenses" },
  { id: "strategy", label: "Strategy", icon: Briefcase, href: "/admin/strategy" },
  { id: "lawfirms", label: "Law Firms", icon: Building2, href: "/admin/lawfirms" },
  { id: "marketing", label: "Marketing", icon: Megaphone, href: "/admin/marketing" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
]

export function AdminMobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  const getActiveId = () => {
    if (!pathname) return "overview"
    if (pathname === "/admin") return "overview"
    const segment = pathname.split("/")[2]
    return segment || "overview"
  }

  const activeId = getActiveId()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all ${
                active
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "animate-pulse" : ""}`} />
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </button>
          )
        })}

        {/* More Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all ${
                moreItems.some((item) => activeId === item.id)
                  ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-slate-900 border-slate-800">
            <SheetHeader>
              <SheetTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                More Admin Tools
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {moreItems.map((item) => {
                const Icon = item.icon
                const active = activeId === item.id
                return (
                  <Button
                    key={item.id}
                    variant={active ? "default" : "outline"}
                    className={`h-20 flex flex-col gap-2 ${
                      active
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 border-0"
                        : "border-slate-700 text-slate-300 hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      router.push(item.href)
                    }}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

