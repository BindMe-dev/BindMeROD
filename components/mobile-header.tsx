"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Menu, Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "@/components/notification-bell"
import { cn } from "@/lib/utils"

interface MobileHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  className?: string
}

export function MobileHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  actions,
  className,
}: MobileHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      router.back()
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0 w-9 h-9 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-white truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      </div>
    </header>
  )
}

