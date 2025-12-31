"use client"

import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  UserCog,
  FileText,
  Building2,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { adminNavItems } from "@/components/admin-sidebar"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

export function AdminMobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Primary nav items for bottom bar
  const primaryNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Overview", href: "/admin" },
    { icon: UserCog, label: "Users", href: "/admin/users" },
    { icon: FileText, label: "Agreements", href: "/admin/agreements" },
    { icon: Building2, label: "Law Firms", href: "/admin/lawfirms" },
  ]

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 lg:hidden" />
      
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 lg:hidden">
        <div className="grid grid-cols-5 h-16">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative transition-colors",
                  active
                    ? "text-blue-400"
                    : "text-slate-400 active:text-slate-300"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-400 rounded-b-full" />
                )}
                
                <Icon className={cn("w-5 h-5", active && "scale-110")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            )
          })}
          
          {/* More Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center gap-1 text-slate-400 active:text-slate-300"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-slate-900 border-slate-800">
              <SheetHeader>
                <SheetTitle className="text-white">Admin Menu</SheetTitle>
              </SheetHeader>
              <div className="grid gap-2 py-4">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        router.push(item.href)
                        setMenuOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition",
                        active
                          ? "bg-blue-900/50 border border-blue-700 text-white"
                          : "text-slate-200 hover:text-white hover:bg-slate-800 border border-transparent"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  )
}

