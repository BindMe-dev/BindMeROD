"use client"

import { use, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { useAgreementPermissions } from "@/hooks/use-agreement-permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  CheckCircle,
  Users,
  Shield,
  FileText,
  Calendar,
  Clock,
  Target,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusBadge } from "@/lib/agreement-actions"
import { AgreementSignatureStatus } from "@/components/agreement-signature-status"
import { AgreementActionButtons } from "@/components/agreement-action-buttons"
import { AgreementLegalBoilerplate } from "@/components/agreement-legal-boilerplate"
import { SmartActionPanel } from "@/components/smart-action-panel"
import { AgreementDetailsBlock } from "@/components/agreement-details-block"
import { DisputeResolutionPanel } from "@/components/dispute-resolution-panel"
import { AgreementChat } from "@/components/agreement-chat"
import { EmailConfirmationPreview } from "@/components/email-confirmation-preview"
import { CounterpartySignDialog } from "@/components/counterparty-sign-dialog"
import { CreatorSignDialog } from "@/components/creator-sign-dialog"
import { WitnessAgreementDialog } from "@/components/witness-agreement-dialog"
import { CompletionCertificate } from "@/components/completion-certificate"
import { AmendmentRequestPanel } from "@/components/amendment-request-panel"

export default function AgreementDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const {
    getAgreementById,
    completeAgreement,
    deleteAgreement,
    updateAgreement,
    addAuditLog,
    signAsCounterparty,
    addWitnessSignature,
    performWorkflowAction,
    refreshAgreements,
  } = useAgreements()
  const [notes, setNotes] = useState("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false)
  const [showCertificate, setShowCertificate] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const counterpartySignTriggerId = `counterparty-sign-${resolvedParams.id}`
  const creatorSignTriggerId = `creator-sign-${resolvedParams.id}`
  const openCounterpartySignDialog = useCallback(() => {
    document.getElementById(counterpartySignTriggerId)?.click()
  }, [counterpartySignTriggerId])
  const openCreatorSignDialog = useCallback(() => {
    document.getElementById(creatorSignTriggerId)?.click()
  }, [creatorSignTriggerId])

  const agreement = getAgreementById(resolvedParams.id)
  const permissions = useAgreementPermissions(
    agreement, 
    user?.id || "", 
    user?.email || ""
  )

  // ALL HOOKS MUST BE DEFINED BEFORE ANY CONDITIONAL RETURNS
  const handleComplete = useCallback(async () => {
    if (!agreement || !permissions.actions || !user) return
    try {
      if (permissions.actions?.canRequestCompletion) {
        await performWorkflowAction(resolvedParams.id, "REQUEST_COMPLETION")
      } else if (permissions.actions?.canConfirmCompletion) {
        await performWorkflowAction(resolvedParams.id, "CONFIRM_COMPLETION")
      } else {
        await completeAgreement(resolvedParams.id)
      }
      await refreshAgreements()

      // Show certificate modal (viral features are triggered server-side in the API)
      setShowCertificate(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed")
    }
  }, [agreement, permissions.actions, performWorkflowAction, completeAgreement, refreshAgreements, resolvedParams.id, user])

  const handleDelete = useCallback(async () => {
    if (!agreement) return
    if (agreement.legal) {
      await addAuditLog(resolvedParams.id, "Agreement Deleted", `Agreement "${agreement.title}" deleted by user`)
    }
    deleteAgreement(resolvedParams.id)
    router.push("/dashboard")
  }, [agreement, addAuditLog, deleteAgreement, router, resolvedParams.id])

  const handleSaveNotes = useCallback(async () => {
    if (!agreement) return
    updateAgreement(resolvedParams.id, { notes })
    setIsEditingNotes(false)
    if (agreement.legal) {
      await addAuditLog(resolvedParams.id, "Notes Updated", "Agreement notes were modified")
    }
  }, [agreement, notes, updateAgreement, addAuditLog, resolvedParams.id])

  const handleCounterpartySign = useCallback(async (
    signatureData: string,
    _signatureType: "drawn" | "typed",
    stamp?: { ipAddress?: string; location?: string },
  ) => {
    try {
      await signAsCounterparty(resolvedParams.id, signatureData, stamp)
      await refreshAgreements()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign agreement"
      if (errorMessage.includes("already signed")) {
        await refreshAgreements()
      } else {
        alert(errorMessage)
      }
    }
  }, [signAsCounterparty, refreshAgreements, resolvedParams.id])

  const handleCreatorSign = useCallback(async (
    signatureData: string,
    _signatureType: "drawn" | "typed",
    stamp?: { ipAddress?: string; location?: string },
  ) => {
    try {
      const res = await fetch(`/api/agreements/${resolvedParams.id}/sign-creator`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData, stamp })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to sign agreement")
      }
      await refreshAgreements()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to sign agreement"
      if (errorMessage.includes("already signed")) {
        await refreshAgreements()
      } else {
        alert(errorMessage)
      }
    }
  }, [refreshAgreements, resolvedParams.id])

  const handleWitnessed = useCallback(async (
    signatureData: string,
    signatureType: "drawn" | "typed",
    stamp?: { ipAddress?: string; location?: string },
  ) => {
    await addWitnessSignature(resolvedParams.id, signatureData, stamp)
    await refreshAgreements()
  }, [addWitnessSignature, refreshAgreements, resolvedParams.id])

  const handleRejectCompletion = useCallback(async (reason: string, evidence?: File[]) => {
    try {
      await performWorkflowAction(resolvedParams.id, "REJECT_COMPLETION", { reason, evidence })
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject completion")
    }
  }, [performWorkflowAction, refreshAgreements, resolvedParams.id])

  const handleRejectSignature = useCallback(async (reason: string, rejectionType: string, requestedChanges?: string, evidence?: File[]) => {
    try {
      const formData = new FormData()
      formData.append('reason', reason)
      formData.append('rejectionType', rejectionType)
      if (requestedChanges) {
        formData.append('requestedChanges', requestedChanges)
      }
      if (evidence) {
        evidence.forEach((file, index) => {
          formData.append(`evidence_${index}`, file)
        })
      }

      const response = await fetch(`/api/agreements/${resolvedParams.id}/reject`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reject agreement')
      }

      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject agreement")
    }
  }, [refreshAgreements, resolvedParams.id])

  const handleTriggerLegalResolution = useCallback(async () => {
    try {
      await performWorkflowAction(resolvedParams.id, "ESCALATE_LEGAL")
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to trigger legal resolution")
    }
  }, [performWorkflowAction, refreshAgreements, resolvedParams.id])

  const handleWorkflowAction = useCallback(async (action: string, payload?: any) => {
    await performWorkflowAction(resolvedParams.id, action, payload)
    await refreshAgreements()
  }, [performWorkflowAction, refreshAgreements, resolvedParams.id])

  const handleProposeFriendlyArrangement = useCallback(async (terms: string) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/friendly`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms })
      })
      
      if (!response.ok) {
        throw new Error("Failed to propose friendly arrangement")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to propose friendly arrangement")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleAcceptAmendment = useCallback(async () => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/respond-amendment-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "accept" }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to accept amendment request")
      }

      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to accept amendment request")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleDeclineAmendment = useCallback(async (message?: string) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/respond-amendment-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reject", message }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to decline amendment request")
      }

      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to decline amendment request")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleSendForSignature = useCallback(async () => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/send-for-signature`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send for signature")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send for signature")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleCancel = useCallback(async (reason: string) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to cancel")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to cancel agreement")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleMarkOccurrence = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await fetch(`/api/agreements/${resolvedParams.id}/occurrences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today })
      })
      
      if (!response.ok) {
        throw new Error("Failed to mark occurrence")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark occurrence")
    }
  }, [resolvedParams.id, refreshAgreements])

  // EARLY RETURN AFTER ALL HOOKS - This prevents hooks order violation
  if (!user || !agreement || !permissions.userContext) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-semibold">Loading agreement</p>
          <p className="text-slate-400 text-sm">If this takes long, please try again from the dashboard.</p>
        </div>
      </div>
    )
  }

  // Helper functions (not hooks, can be after early return)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getStatusColor = () => {
    switch (agreement.status) {
      case "active":
        return "bg-primary/10 text-primary border-primary/20"
      case "completed":
        return "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "draft":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
      case "pending_signature":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeIcon = () => {
    switch (agreement.type) {
      case "one-time":
        return <Target className="w-4 h-4" />
      case "recurring":
        return <Target className="w-4 h-4" />
      case "deadline":
        return <Clock className="w-4 h-4" />
      case "bet":
        return <Target className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getEmailConfirmation = (agreementId: string, userEmail: string) => {
    const agreement = getAgreementById(agreementId)
    if (!agreement) return ""
    // Return empty for now - email generation handled server-side
    return ""
  }

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return
    setIsDownloading(true)

    try {
      const html2canvas = (await import("html2canvas")).default
      const { default: jsPDF } = await import("jspdf")

      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.tagName === 'STYLE' || element.tagName === 'LINK'
        }
      })
      const imgData = canvas.toDataURL("image/png")

      const pdf = new jsPDF("p", "pt", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let position = 0
      let heightLeft = imgHeight

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST")
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, "", "FAST")
        heightLeft -= pageHeight
      }

      const safeTitle = agreement.title ? agreement.title.replace(/[^a-z0-9-_]/gi, "_") : "agreement"
      pdf.save(`${safeTitle}-${agreement.id}.pdf`)
    } catch (err) {
      console.error("PDF download failed", err)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const getTodayCompletion = () => {
    if (agreement.type === "recurring") {
      const today = new Date().toISOString().split("T")[0]
      return agreement.completions?.find((c) => c.date === today)
    }
    return null
  }

  const todayCompletion = getTodayCompletion()
  const isPartner = agreement.partners?.some((p) => p.email === user.email)
  const creatorInfo = agreement.user || { name: "Unknown Creator", email: "" }
  const isCreator = agreement.userId === user.id
  const sharedParticipants = agreement.sharedWith || []
  const counterparties = sharedParticipants.filter((p) => (p.role ?? "counterparty") === "counterparty")
  const designatedWitnesses = sharedParticipants.filter((p) => (p.role ?? "counterparty") === "witness")
  const userEmailLower = user.email.toLowerCase()
  const isCounterpartyUser =
    counterparties.some((p) => p.userId === user.id) ||
    counterparties.some((p) => (p.userEmail || "").toLowerCase() === userEmailLower)

  const isParticipant = isCreator || isCounterpartyUser

  // Display creator information for counterparties
  if (isCounterpartyUser && !isCreator) {
    console.log("Creator info:", creatorInfo)
  }

  // Add debug logging to see what's happening
  console.log("Agreement signature debug:", {
    agreementId: resolvedParams.id,
    userEmail: user?.email,
    userId: user?.id,
    legalSignatures: agreement.legal?.signatures,
    counterpartySignatures: agreement.legal?.signatures?.filter(s => s.role === "counterparty"),
    isCounterpartyUser,
    hasSignedAsCounterparty: agreement.legal?.signatures?.filter(s => s.role === "counterparty").some(
      (s) => s.signedBy === user.id || (s.signedByEmail || "").toLowerCase() === user.email?.toLowerCase(),
    )
  })

  // Add debug logging for the full agreement object
  console.log("Full agreement object:", agreement)
  console.log("Agreement legal field:", agreement.legal)
  console.log("Agreement legalSignatures field:", agreement.legalSignatures)
  
  // The signatures might be in legalSignatures instead of legal.signatures
  const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
  
  const creatorSignature = allSignatures.find((s) => s.role === "creator")
  const witnessSignatures = allSignatures.filter((s) => s.role === "witness") || []
  const counterpartySignatures = allSignatures.filter((s) => s.role === "counterparty") || []
  
  const hasSignedAsCounterparty = counterpartySignatures.some(
    (s) => s.signedBy === user.id || s.signedByEmail?.toLowerCase() === user.email?.toLowerCase()
  )
  
  const hasSignedAsWitness = witnessSignatures.some(
    (s) => s.signedBy === user.id || s.signedByEmail?.toLowerCase() === user.email?.toLowerCase()
  )
  
  const hasCreatorSignature = !!creatorSignature
  const hasAnySignatures = allSignatures.length > 0
  const hasUserSigned = hasSignedAsCounterparty || (isCreator && hasCreatorSignature) || hasSignedAsWitness
  
  // Define canSignAsCounterparty logic
  const signableStatuses = ["pending_signature", "active"] as const
  const canSignAsCounterparty = isCounterpartyUser && !hasSignedAsCounterparty && signableStatuses.includes(agreement.status as any)
  const canWithdraw = isCreator && !hasAnySignatures && !["withdrawn", "completed", "legal_resolution", "disputed", "pending_completion"].includes(agreement.status)
  
  // Determine "Valid Until" date
  const validUntilDate =
    agreement.endDate ||
    agreement.deadline ||
    agreement.targetDate ||
    agreement.betSettlementDate
  
  // Use permission system data
  const creatorSigned = permissions.signatures.creatorSigned
  const counterpartySigned = permissions.signatures.counterpartySigned
  
  const completionPending = agreement.status === "pending_completion"
  const userRequestedCompletion = agreement.completionRequestedBy === user.id
  const hasRejection = !!agreement.rejectedBy
  
  // Either party can request completion when both have signed
  const canRequestCompletion = isParticipant && agreement.status === "active" && counterpartySignatures.length > 0
  // Only the OTHER party (who didn't request) can confirm/deny completion
  const canConfirmCompletion = agreement.status === "pending_completion" && isParticipant && agreement.completionRequestedBy !== user.id
  
  // Enhanced witness logic with all scenarios
  const isDesignatedWitness = designatedWitnesses?.some(
    (witness) => {
      const emailMatch = witness.userEmail?.toLowerCase() === user?.email?.toLowerCase()
      const idMatch = witness.userId === user?.id
      return emailMatch || idMatch
    }
  ) || false
  
  const hasWitnessedAlready = witnessSignatures.some(
    (sig) => sig.signedBy === user.id || sig.signedByEmail?.toLowerCase() === user.email?.toLowerCase()
  )
  
  const canWitnessSign = isDesignatedWitness && 
                        !hasWitnessedAlready && 
                        agreement.status === "active" &&
                        !isCreator && 
                        !isCounterpartyUser

  const isWitnessOnly = isDesignatedWitness && !isCreator && !isCounterpartyUser
  
  const getWitnessStatus = () => {
    if (!isDesignatedWitness) return null
    if (hasWitnessedAlready) return "✓ You witnessed"
    if (agreement.status !== "active") return "Agreement not active"
    if (isCreator || isCounterpartyUser) return "Cannot witness - you're a participant"
    return "Ready to witness"
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Enhanced background with animated gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/50 to-slate-950" />
      </div>
      <EmailConfirmationPreview
        open={emailPreviewOpen}
        onOpenChange={setEmailPreviewOpen}
        emailContent={getEmailConfirmation(resolvedParams.id, user.email)}
      />
      <main ref={contentRef} className="relative z-10 container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Hero Card with Enhanced Design */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative rounded-2xl sm:rounded-3xl">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
            </div>
            
            <CardHeader className="relative p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6 mb-6">
                <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full">
                  <Badge variant="outline" className={cn("gap-2 px-4 py-2 text-sm font-semibold", getStatusColor())}>
                    {getTypeIcon()}
                    <span className="capitalize">{agreement.type.replace("-", " ")}</span>
                  </Badge>
                  <Badge variant="outline" className={cn("capitalize px-4 py-2 text-sm font-semibold", getStatusColor())}>
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      agreement.status === "active" ? "bg-green-400 animate-pulse" :
                      agreement.status === "completed" ? "bg-blue-400" :
                      agreement.status === "overdue" ? "bg-red-400 animate-pulse" : "bg-gray-400"
                    )} />
                    {agreement.status}
                  </Badge>
                  {agreement.isShared && (
                    <Badge variant="outline" className="gap-2 bg-purple-500/10 text-purple-300 border-purple-500/30 px-4 py-2">
                      <Users className="w-4 h-4" />
                      Shared Agreement
                    </Badge>
                  )}
                  {agreement.legal && (
                    <Badge variant="outline" className="gap-2 bg-blue-500/10 text-blue-300 border-blue-500/30 px-4 py-2">
                      <Shield className="w-4 h-4" />
                      Legally Binding
                    </Badge>
                  )}
                  {/* Signature status */}
                  {user && (
                    <AgreementSignatureStatus 
                      agreement={agreement}
                      signatures={permissions.signatures}
                      isWitnessOnly={isWitnessOnly}
                    />
                  )}
                  {agreement.legal?.witnessStatus === "witnessed" && (
                    <Badge variant="outline" className="gap-2 bg-green-500/10 text-green-300 border-green-500/30 px-4 py-2">
                      <Shield className="w-4 h-4" />
                      Witnessed & Verified
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto gap-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                  >
                    <FileText className="w-4 h-4" />
                    {isDownloading ? "Preparing PDF..." : "Download PDF"}
                  </Button>
                  {!isWitnessOnly && canSignAsCounterparty && (
                    <CounterpartySignDialog agreement={agreement} onSign={handleCounterpartySign} />
                  )}
                </div>
              </div>
              <div className="mt-6">
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
                  {agreement.title}
                </CardTitle>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-4">
                  <Badge variant="outline" className="font-mono text-[10px] sm:text-xs bg-slate-800/50 text-slate-400 border-slate-600 px-3 py-1">
                    ID: {agreement.id}
                  </Badge>
                  <div className="hidden sm:block w-1 h-1 bg-slate-600 rounded-full" />
                  <span className="text-sm text-slate-400">Created {formatDateTime(agreement.createdAt)}</span>
                </div>
                {agreement.description && (
                  <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-4">{agreement.description}</p>
                )}
                {/* Remove purpose section - not available in Agreement type */}
              </div>
            </CardHeader>
            <CardContent className="space-y-8 relative p-4 sm:p-6">
              {/* Primary actions surfaced at the top for quick access */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-3">
                  <AgreementActionButtons
                    agreement={agreement}
                    userContext={permissions.userContext}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                    onSignAsCounterparty={handleCounterpartySign}
                    onSignAsCreator={handleCreatorSign}
                    onRejectCompletion={handleRejectCompletion}
                    onRejectSignature={handleRejectSignature}
                    onTriggerLegal={handleTriggerLegalResolution}
                    onProposeFriendly={handleProposeFriendlyArrangement}
                    onSendForSignature={handleSendForSignature}
                    onCancel={handleCancel}
                    onWithdraw={
                      canWithdraw
                        ? async () => {
                            try {
                              const res = await fetch(`/api/agreements/${resolvedParams.id}/withdraw`, {
                                method: "POST",
                                credentials: "include",
                              })
                              if (!res.ok) {
                                const data = await res.json().catch(() => ({}))
                                throw new Error(data.error || "Failed to withdraw")
                              }
                              await refreshAgreements()
                            } catch (err) {
                              alert(err instanceof Error ? err.message : "Failed to withdraw")
                            }
                          }
                        : undefined
                    }
                    onDuplicate={async () => {
                      try {
                        const res = await fetch(`/api/agreements/${resolvedParams.id}/duplicate`, {
                          method: "POST",
                          credentials: "include",
                        })
                        if (!res.ok) throw new Error("Failed to duplicate")
                        const data = await res.json()
                        router.push(`/agreement/${data.id}`)
                      } catch (err) {
                        alert(err instanceof Error ? err.message : "Failed to duplicate")
                      }
                    }}
                    counterpartySignTriggerId={counterpartySignTriggerId}
                    creatorSignTriggerId={creatorSignTriggerId}
                  />
                </div>
                {/* Witness signing logic */}
                {isDesignatedWitness && (
                  <div className="flex items-center gap-2">
                    {canWitnessSign ? (
                      <WitnessAgreementDialog agreement={agreement} onWitnessed={refreshAgreements} />
                    ) : (
                      <Badge variant="outline" className={cn(
                        "gap-2",
                        hasWitnessedAlready 
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      )}>
                        <Shield className="w-4 h-4" />
                        {getWitnessStatus()}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced Information Grid */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Calendar className="w-4 h-4" />
                    Agreement Date
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">{formatDate(agreement.effectiveDate)}</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Created
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">{formatDateTime(agreement.createdAt)}</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Effective From
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">{formatDate(agreement.effectiveDate)}</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Valid Until
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">
                    {agreement.isPermanent ? (
                      <span className="text-green-400">Permanent</span>
                    ) : validUntilDate ? (
                      formatDate(validUntilDate)
                    ) : (
                      <span className="text-slate-500">Not set</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Add Participants Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Creator</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{creatorInfo.name || "Unknown Creator"}</p>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-xs">
                      Creator
                    </Badge>
                  </div>
                </div>
                
                {counterparties.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Counterparty</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{counterparties[0].userName}</p>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          counterpartySignatures.length > 0
                            ? "bg-green-500/10 text-green-300 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                        )}
                      >
                        {counterpartySignatures.length > 0 ? "✓ Signed" : "⏳ Pending"}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {agreement.status === "disputed" && isParticipant && (
                <>
                  <DisputeResolutionPanel
                    agreement={agreement}
                    userId={user.id}
                    onAction={handleWorkflowAction}
                  />

                  {/* Legal Help CTA */}
                  <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Need Professional Legal Help?
                          </h3>
                          <p className="text-slate-300 text-sm mb-4">
                            If friendly resolution isn't working, connect with verified law firms who specialize in {agreement.type?.toLowerCase() || 'agreement'} disputes.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={() => router.push(`/legal-help?agreementId=${agreement.id}`)}
                              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Browse Law Firms
                            </Button>
                            <Button
                              variant="outline"
                              className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
                              onClick={() => router.push(`/legal-help?agreementId=${agreement?.id}`)}
                            >
                              Request Quick Consultation
                            </Button>
                          </div>
                          <p className="text-xs text-slate-400 mt-3">
                            ✓ Verified firms only • ✓ Transparent pricing • ✓ Free consultations available
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
              <AgreementDetailsBlock agreement={agreement} />
            </div>
            
            {/* Smart Action Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Amendment Request Panel */}
                {agreement.status === "pending_amendment" && isCreator && (
                  <AmendmentRequestPanel
                    agreement={agreement}
                    onAccept={handleAcceptAmendment}
                    onDecline={handleDeclineAmendment}
                  />
                )}

                <SmartActionPanel
                  agreement={agreement}
                  userId={user.id}
                  isCreator={isCreator}
                  isCounterpartyUser={isCounterpartyUser}
                  actions={permissions.actions}
                  counterpartySignatures={counterpartySignatures}
                  onComplete={handleComplete}
                  onSignAsCounterparty={openCounterpartySignDialog}
                  onSignAsCreator={openCreatorSignDialog}
                  onEdit={() => router.push(`/agreement/${resolvedParams.id}/edit`)}
                  onSendForSignature={async () => {
                    try {
                      const res = await fetch(`/api/agreements/${resolvedParams.id}/send-for-signature`, {
                        method: "POST",
                        credentials: "include",
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || "Failed to send for signature")
                      }
                      await refreshAgreements()
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Failed to send for signature")
                    }
                  }}
                  onCancel={async () => {
                    if (!confirm("Are you sure you want to cancel this agreement?")) return
                    try {
                      const res = await fetch(`/api/agreements/${resolvedParams.id}/cancel`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ reason: "Cancelled by creator" })
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        throw new Error(data.error || "Failed to cancel")
                      }
                      await refreshAgreements()
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Failed to cancel")
                    }
                  }}
                  onWorkflowAction={handleWorkflowAction}
                  onDownloadReceipt={async () => {
                    try {
                      const res = await fetch(`/api/agreements/${resolvedParams.id}/receipt`)
                      if (!res.ok) throw new Error("Failed to download receipt")
                      const blob = await res.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `agreement-${resolvedParams.id}-receipt.pdf`
                      a.click()
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Failed to download receipt")
                    }
                  }}
                  onDuplicate={async () => {
                    try {
                      const res = await fetch(`/api/agreements/${resolvedParams.id}/duplicate`, {
                        method: "POST",
                        credentials: "include",
                      })
                      if (!res.ok) throw new Error("Failed to duplicate")
                      const data = await res.json()
                      router.push(`/agreement/${data.id}`)
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Failed to duplicate")
                    }
                  }}
                  onViewAudit={() => {
                    // Scroll to audit section or open modal
                    document.getElementById('audit-log')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  counterpartySignTriggerId={counterpartySignTriggerId}
                  creatorSignTriggerId={creatorSignTriggerId}
                  onWithdraw={
                    canWithdraw
                      ? async () => {
                          try {
                            const res = await fetch(`/api/agreements/${resolvedParams.id}/withdraw`, {
                              method: "POST",
                              credentials: "include",
                            })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              throw new Error(data.error || "Failed to withdraw")
                            }
                            await refreshAgreements()
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Failed to withdraw")
                          }
                        }
                      : undefined
                  }
                />

                <div className="flex gap-3 pt-4 flex-wrap">
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Component */}
          <AgreementChat agreementId={resolvedParams.id} />
        </div>
      </main>

      {/* Completion Certificate Modal */}
      {showCertificate && agreement && user && (
        <CompletionCertificate
          agreementId={agreement.id}
          agreementType={agreement.type}
          userName={user.name || user.email}
          open={showCertificate}
          onOpenChange={setShowCertificate}
        />
      )}
    </div>
  )
}
