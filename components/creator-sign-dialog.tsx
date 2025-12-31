"use client"

import type { Agreement } from "@/lib/agreement-types"
import { CounterpartySignDialog } from "./counterparty-sign-dialog"

interface CreatorSignDialogProps {
  agreement: Agreement
  triggerId?: string
  onSign: (
    signatureData: string,
    signatureType: "drawn" | "typed",
    stamp?: { ipAddress?: string; location?: string },
  ) => Promise<void>
}

export function CreatorSignDialog({ agreement, onSign, triggerId }: CreatorSignDialogProps) {
  return (
    <CounterpartySignDialog
      agreement={agreement}
      role="creator"
      triggerId={triggerId}
      onSign={onSign}
    />
  )
}

