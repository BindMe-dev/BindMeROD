"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checked, setChecked] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/admin", { credentials: "include" })
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
      } catch {
        setIsAdmin(false)
      } finally {
        setChecked(true)
      }
    }
    checkAdmin()
  }, [])

  if (!checked || !isAdmin) return null

  const inAdmin = pathname?.startsWith("/admin")

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`text-slate-300 hover:text-white hover:bg-slate-800 ${
        inAdmin ? "bg-slate-800 text-white" : ""
      }`}
      onClick={() => router.push(inAdmin ? "/dashboard" : "/admin")}
    >
      <Shield className="w-4 h-4 mr-1" />
      {inAdmin ? "User view" : "Admin"}
    </Button>
  )
}
