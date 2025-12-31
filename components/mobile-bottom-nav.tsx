"use client"

import { useRouter, usePathname } from "next/navigation"
import { Home, FileText, Calendar, Trophy, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

export function MobileBottomNav() {
  const router = useRouter()
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: FileText, label: "Create", href: "/create-agreement" },
    { icon: Calendar, label: "Calendar", href: "/calendar" },
    { icon: Trophy, label: "Rewards", href: "/statistics" },
    { icon: Settings, label: "More", href: "/settings" },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
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
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <div className="absolute top-1 right-1/4 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}

