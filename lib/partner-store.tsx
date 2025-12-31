"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Partner } from "./agreement-types"

interface PartnerContextType {
  partners: Partner[]
  addPartner: (partner: Omit<Partner, "id" | "addedAt">) => Partner
  removePartner: (id: string) => void
  getPartnerById: (id: string) => Partner | undefined
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined)

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [partners, setPartners] = useState<Partner[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("bindme_partners")
    if (stored) {
      setPartners(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    if (partners.length > 0 || localStorage.getItem("bindme_partners")) {
      localStorage.setItem("bindme_partners", JSON.stringify(partners))
    }
  }, [partners])

  const addPartner = (partner: Omit<Partner, "id" | "addedAt">) => {
    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `partner-${Math.random().toString(36).slice(2, 10)}`

    const newPartner: Partner = {
      ...partner,
      id,
      addedAt: new Date().toISOString(),
    }
    setPartners((prev) => [...prev, newPartner])
    return newPartner
  }

  const removePartner = (id: string) => {
    setPartners((prev) => prev.filter((partner) => partner.id !== id))
  }

  const getPartnerById = (id: string) => {
    return partners.find((partner) => partner.id === id)
  }

  return (
    <PartnerContext.Provider value={{ partners, addPartner, removePartner, getPartnerById }}>
      {children}
    </PartnerContext.Provider>
  )
}

export function usePartners() {
  const context = useContext(PartnerContext)
  if (context === undefined) {
    throw new Error("usePartners must be used within a PartnerProvider")
  }
  return context
}
