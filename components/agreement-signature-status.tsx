"use client"

import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agreement } from "@/lib/agreement-types"

interface SignatureStatusProps {
  agreement: Agreement
  signatures: {
    all: any[]
    creator: any | null
    counterparty: any[]
    witness: any[]
    hasSignedAsCounterparty?: boolean
    hasSignedAsWitness?: boolean
  }
  isWitnessOnly?: boolean
}

export function AgreementSignatureStatus({
  agreement,
  signatures,
  isWitnessOnly,
}: SignatureStatusProps) {
  const allSignatures = signatures?.all || agreement.legalSignatures || agreement.legal?.signatures || []
  const counterpartySignatures = signatures?.counterparty || []
  const creatorSigned = !!signatures?.creator || allSignatures.some((s: any) => s.role === "creator")
  const counterpartySigned = counterpartySignatures.length > 0 || allSignatures.some((s: any) => s.role === "counterparty")
  const hasUserSigned = !!(signatures?.hasSignedAsCounterparty || signatures?.hasSignedAsWitness || creatorSigned)
  const hasAnySignatures = allSignatures.length > 0
  const allPartiesSigned = creatorSigned && counterpartySigned

  const getStatusConfig = () => {
    if (allPartiesSigned) {
      return {
        color: "bg-green-500/10 text-green-300 border-green-500/30",
        dotColor: "bg-green-400",
        label: "All parties signed",
      }
    }

    if (!hasAnySignatures) {
      return {
        color: "bg-slate-500/10 text-slate-300 border-slate-500/30",
        dotColor: "bg-slate-400",
        label: "No Signatures"
      }
    }

    if (creatorSigned && !counterpartySigned) {
      return {
        color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-400 animate-pulse",
        label: "Awaiting counterparty signature",
      }
    }

    if (!creatorSigned && counterpartySigned) {
      return {
        color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
        dotColor: "bg-amber-400 animate-pulse",
        label: "Creator signature required",
      }
    }

    if (hasUserSigned) {
      return {
        color: "bg-green-500/10 text-green-300 border-green-500/30",
        dotColor: "bg-green-400",
        label: signatures?.hasSignedAsWitness
          ? "You witnessed"
          : signatures?.hasSignedAsCounterparty
          ? "You signed as counterparty"
          : "You signed as creator",
      }
    }

    return {
      color: "bg-red-500/10 text-red-300 border-red-500/30",
      dotColor: "bg-red-400",
      label: "Signature Required"
    }
  }

  const status = getStatusConfig()

  return (
    <>
      <Badge 
        variant="outline" 
        className={cn("gap-2 px-4 py-2 text-sm font-semibold", status.color)}
      >
        <div className={cn("w-2 h-2 rounded-full", status.dotColor)} />
        {status.label}
      </Badge>
      
      {agreement.legal?.witnessStatus === "witnessed" && (
        <Badge variant="outline" className="gap-2 bg-green-500/10 text-green-300 border-green-500/30 px-4 py-2">
          <Shield className="w-4 h-4" />
          Witnessed & Verified
        </Badge>
      )}
    </>
  )
}
