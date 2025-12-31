"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
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
import { Shield, Eye } from "lucide-react"
import type { Agreement } from "@/lib/agreement-types"
import { useClientStamp } from "@/lib/use-client-stamp"
import { useAgreements } from "@/lib/agreement-store"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface WitnessAgreementDialogProps {
  agreement: Agreement
  onWitnessed: () => void
}

export function WitnessAgreementDialog({ agreement, onWitnessed }: WitnessAgreementDialogProps) {
  const { user } = useAuth()
  const { addWitnessSignature } = useAgreements()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [signatureType, setSignatureType] = useState<"drawn" | "typed" | null>(null)
  const { ipAddress, location, loading: stampLoading } = useClientStamp(isOpen)

  // Check if already witnessed
  const isAlreadyWitnessed = useMemo(() => {
    if (!user?.email) return false
    
    const allSigs = agreement.legalSignatures || agreement.legal?.signatures || []
    return allSigs.some(sig => 
      sig.role === "witness" && 
      (sig.signedBy === user.id || sig.signedByEmail?.toLowerCase() === user.email.toLowerCase())
    )
  }, [agreement, user])

  const handleSignatureComplete = (signatureData: string, type: "drawn" | "typed") => {
    console.log("Signature completed:", { signatureData: signatureData.substring(0, 50) + "...", type })
    setSignature(signatureData)
    setSignatureType(type)
  }

  const handleWitness = async () => {
    if (!user || !signature || isAlreadyWitnessed) {
      console.log("Cannot witness:", { user: !!user, signature: !!signature, isAlreadyWitnessed })
      return
    }

    console.log("Witnessing with signature:", signature.substring(0, 50) + "...")
    
    setIsLoading(true)
    try {
      await addWitnessSignature(agreement.id, signature, { ipAddress, location })
      setIsOpen(false)
      setSignature(null)
      setSignatureType(null)
      onWitnessed?.()
      toast({
        title: "Success",
        description: "Agreement witnessed successfully!",
      })
    } catch (error: any) {
      console.error("Witness failed:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to witness agreement",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAlreadyWitnessed) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-2">
        <Shield className="w-4 h-4" />
        Already witnessed
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <Shield className="w-4 h-4" />
          Witness Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Witness Agreement
          </DialogTitle>
          <DialogDescription>
            As a witness, you confirm that you have observed the parties' intent to enter this agreement.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">1. Digital Signature</h4>
            <SignaturePad onSignatureComplete={handleSignatureComplete} userName={user?.name} />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                {stampLoading
                  ? "Fetching IP and location..."
                  : `Stamp: ${ipAddress} • ${location}`}
              </p>
            </div>
            {signature && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-900">
                Signature captured. Your witness signature will be recorded with timestamp, IP, and location.
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleWitness}
              disabled={!signature || isLoading || stampLoading}
              className="flex-1"
            >
              {isLoading ? "Witnessing..." : "Witness Agreement"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
