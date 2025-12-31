"use client"

import type React from "react"

import { useState } from "react"
import type { Agreement } from "@/lib/agreement-types"
import { useAuth } from "@/lib/auth-context"
import { useClientStamp } from "@/lib/use-client-stamp"
import { SignaturePad } from "@/components/signature-pad"
import { TermsAndConditions } from "@/components/terms-and-conditions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, PenLine } from "lucide-react"

interface CounterpartySignDialogProps {
  agreement: Agreement
  role?: "counterparty" | "creator"
  triggerId?: string
  onSign: (
    signatureData: string,
    signatureType: "drawn" | "typed",
    stamp?: { ipAddress?: string; location?: string },
  ) => Promise<void>
}

export function CounterpartySignDialog({ agreement, onSign, role = "counterparty", triggerId }: CounterpartySignDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [intentConfirmed, setIntentConfirmed] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [signatureType, setSignatureType] = useState<"drawn" | "typed" | null>(null)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false) // NEW: Track if signature is confirmed
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { ipAddress, location, loading: stampLoading } = useClientStamp(open)

  const triggerLabel = role === "creator" ? "Sign as creator" : "Sign agreement"
  const resolvedIp = ipAddress && ipAddress !== "Loading..." ? ipAddress : "Unknown IP"
  const resolvedLocation = location && location !== "Loading..." ? location : "Unknown location"

  const handleSignatureComplete = (sig: string, type: "drawn" | "typed") => {
    setSignature(sig)
    setSignatureType(type)
    setSignatureConfirmed(false) // Reset confirmation when signature changes
  }

  const handleUseSignature = () => {
    if (!signature || !signatureType) {
      alert("Please provide a signature first.")
      return
    }
    setSignatureConfirmed(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !signature || !signatureType || !signatureConfirmed) {
      alert("Please confirm your signature before signing the agreement.")
      return
    }
    if (!termsAccepted || !intentConfirmed) {
      alert("Please accept all requirements to sign this agreement.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSign(signature, signatureType, { ipAddress: resolvedIp, location: resolvedLocation })
      setTermsAccepted(false)
      setIntentConfirmed(false)
      setSignature(null)
      setSignatureType(null)
      setSignatureConfirmed(false)
      setOpen(false)
      alert("Agreement signed successfully! The page will refresh to show the updated status.")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to sign agreement"
      if (errorMessage.includes("already signed")) {
        alert("You have already signed this agreement. The page will refresh to show the current status.")
        setOpen(false)
      } else {
        alert("Failed to sign agreement. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
  const isAlreadySigned = allSignatures.some((sig) => {
    const isRoleMatch = sig.role === role
    const emailMatch = sig.userEmail?.toLowerCase() === user?.email?.toLowerCase()
    const idMatch = sig.userId === user?.id
    return isRoleMatch && (emailMatch || idMatch)
  })

  if (isAlreadySigned) {
    return (
      <Badge variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="w-4 h-4" />
        {role === "creator" ? "Creator signed" : "Already signed"}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2" id={triggerId}>
          <PenLine className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <PenLine className="w-5 h-5 text-primary" />
            {role === "creator" ? "Sign as creator" : "Sign as counterparty"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Your signature will be recorded with timestamp, IP, and device details for legal evidence.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Agreement overview</h4>
                <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-200">
                  {role === "creator" ? "Creator" : "Counterparty"}
                </Badge>
              </div>
              <p className="text-base font-semibold text-white line-clamp-2">{agreement.title}</p>
              {agreement.description && (
                <p className="text-sm text-slate-400 line-clamp-3">{agreement.description}</p>
              )}
              <div className="text-xs text-slate-400 space-y-1">
                <p><span className="text-slate-300">Type:</span> {agreement.type}</p>
                {agreement.effectiveDate && (
                  <p><span className="text-slate-300">Effective:</span> {new Date(agreement.effectiveDate).toLocaleDateString()}</p>
                )}
                {agreement.deadline && (
                  <p><span className="text-slate-300">Deadline:</span> {new Date(agreement.deadline).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">Evidence captured</h4>
              <div className="text-xs text-slate-400 space-y-2">
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-200">IP</Badge>
                  {stampLoading ? "Fetching IP..." : resolvedIp}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-200">Location</Badge>
                  {stampLoading ? "Fetching location..." : resolvedLocation}
                </p>
                <p className="text-slate-500">Timestamp and device details are stored automatically.</p>
              </div>
            </div>
          </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200">Review & accept</h4>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-200 border-amber-500/30">Required</Badge>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 max-h-52 overflow-y-auto">
                <TermsAndConditions hideCheckboxes />
              </div>
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-slate-200">
                <Checkbox
                  id="counterparty-terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <span className="leading-relaxed">
                  I have read and agree to the BindMe Terms of Service and the terms of this agreement.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-200">
                <Checkbox
                  id="counterparty-intent"
                  checked={intentConfirmed}
                  onCheckedChange={(checked) => setIntentConfirmed(checked === true)}
                />
                <span className="leading-relaxed">
                  {role === "creator"
                    ? "I confirm I am the creator and intend to be legally bound by this agreement."
                    : "I confirm I am the intended counterparty and intend to be legally bound by this agreement."}
                </span>
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-200">Signature</h4>
              {signatureConfirmed && (
                <Badge variant="outline" className="bg-green-500/10 text-green-200 border-green-500/30">Confirmed</Badge>
              )}
            </div>
            <SignaturePad onSignatureComplete={handleSignatureComplete} userName={user?.name} />
            <div className="text-xs text-slate-400">
              {stampLoading ? "Fetching IP and location..." : `Stamp: ${resolvedIp} · ${resolvedLocation}`}
            </div>
            {signature && !signatureConfirmed && (
              <Button
                type="button"
                variant="outline"
                onClick={handleUseSignature}
                className="w-full border-blue-500/30 text-blue-200 hover:bg-blue-500/10"
                disabled={stampLoading}
              >
                Use this signature
              </Button>
            )}
            {signatureConfirmed && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-100">
                ✓ Signature confirmed with IP: {resolvedIp} and location: {resolvedLocation}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 border-slate-700 text-slate-200" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!termsAccepted || !intentConfirmed || !signatureConfirmed || isSubmitting}
            >
              {isSubmitting ? "Signing..." : "Sign Agreement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
