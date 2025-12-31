"use client"

import { use, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAgreements } from "@/lib/agreement-store"
import { getAvailableActions, getPrimaryAction, getStatusBadge, getAvailableStateTransitions } from "@/lib/agreement-actions"
import type { UserContext } from "@/lib/agreement-actions"
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
  AlertTriangle,
  XCircle,
  Edit3,
  Download,
  Copy,
  Eye,
  Send,
  FileEdit,
  Ban,
  RefreshCw,
  Scale,
  Gavel,
  MessageSquare,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AgreementSignatureStatus } from "@/components/agreement-signature-status"
import { AgreementLegalBoilerplate } from "@/components/agreement-legal-boilerplate"
import { SmartActionPanel } from "@/components/smart-action-panel"
import { AgreementDetailsBlock } from "@/components/agreement-details-block"
import { DisputeResolutionPanel } from "@/components/dispute-resolution-panel"
import { AgreementChat } from "@/components/agreement-chat"
import { EmailConfirmationPreview } from "@/components/email-confirmation-preview"
import { CounterpartySignDialog } from "@/components/counterparty-sign-dialog"
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

  const openCounterpartySignDialog = useCallback(() => {
    document.getElementById(counterpartySignTriggerId)?.click()
  }, [counterpartySignTriggerId])

  const agreement = getAgreementById(resolvedParams.id)
  
  // Build UserContext for permission system
  const allSignatures = agreement?.legalSignatures || agreement?.legal?.signatures || []
  const counterpartySignatures = allSignatures.filter(s => s.role === "counterparty")
  const witnessSignatures = allSignatures.filter(s => s.role === "witness")
  
  const userContext: UserContext | null = user && agreement ? {
    userId: user.id,
    email: user.email,
    isCreator: agreement.creatorId === user.id,
    isCounterparty: agreement.sharedWith?.some(
      p => p.userId === user.id || p.email.toLowerCase() === user.email.toLowerCase()
    ) || false,
    isWitness: agreement.sharedWith?.some(
      p => p.role === "witness" && (p.userId === user.id || p.email.toLowerCase() === user.email.toLowerCase())
    ) || false,
    hasSignedAsCounterparty: counterpartySignatures.some(
      s => s.userId === user.id || s.userEmail?.toLowerCase() === user.email.toLowerCase()
    ),
    hasSignedAsWitness: witnessSignatures.some(
      s => s.userId === user.id || s.userEmail?.toLowerCase() === user.email.toLowerCase()
    ),
    isAdmin: user.role === "admin" || false,
  } : null

  // Get available actions from enhanced permission system
  const actions = agreement && userContext ? getAvailableActions(agreement, userContext) : null
  const primaryAction = agreement && userContext ? getPrimaryAction(agreement, userContext) : null
  const statusBadge = agreement ? getStatusBadge(agreement.status) : null
  const availableTransitions = agreement && userContext ? getAvailableStateTransitions(agreement, userContext) : []

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleComplete = useCallback(async () => {
    if (!agreement || !actions || !user) return
    try {
      if (actions.canRequestCompletion) {
        await performWorkflowAction(resolvedParams.id, "REQUEST_COMPLETION")
      } else if (actions.canConfirmCompletion) {
        await performWorkflowAction(resolvedParams.id, "CONFIRM_COMPLETION")
      } else {
        await completeAgreement(resolvedParams.id)
      }
      await refreshAgreements()
      setShowCertificate(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed")
    }
  }, [agreement, actions, performWorkflowAction, completeAgreement, refreshAgreements, resolvedParams.id, user])

  const handleDelete = useCallback(async () => {
    if (!agreement) return
    if (!confirm("Are you sure you want to delete this agreement? This action cannot be undone.")) return
    
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

  const handleSendForSignature = useCallback(async (expirationDays?: number) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/send-for-signature`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expirationDays })
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

  const handleWithdrawOffer = useCallback(async (reason?: string) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to withdraw offer")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to withdraw offer")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleTerminateAgreement = useCallback(async (reason: string, effectiveDate?: string, settlementTerms?: string) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason, effectiveDate, settlementTerms })
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to terminate agreement")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to terminate agreement")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleRequestAmendment = useCallback(async (
    title: string,
    description: string,
    changes: any[],
    rationale: string,
    urgency: "routine" | "urgent"
  ) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/request-amendment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description, changes, rationale, urgency })
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to request amendment")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request amendment")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleRespondToAmendment = useCallback(async (
    response: "accept" | "reject" | "counter-propose",
    message?: string,
    counterProposalChanges?: any[]
  ) => {
    try {
      const res = await fetch(`/api/agreements/${resolvedParams.id}/respond-amendment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ response, message, counterProposalChanges })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to respond to amendment")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to respond to amendment")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleReportBreach = useCallback(async (
    breachType: string,
    severity: string,
    description: string,
    evidence: File[]
  ) => {
    try {
      const formData = new FormData()
      formData.append('breachType', breachType)
      formData.append('severity', severity)
      formData.append('description', description)
      evidence.forEach((file, index) => {
        formData.append(`evidence_${index}`, file)
      })

      const response = await fetch(`/api/agreements/${resolvedParams.id}/report-breach`, {
        method: "POST",
        credentials: "include",
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to report breach")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to report breach")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleRespondToBreach = useCallback(async (
    responseType: "dispute" | "acknowledge" | "counter-evidence",
    message: string,
    counterEvidence?: File[]
  ) => {
    try {
      const formData = new FormData()
      formData.append('responseType', responseType)
      formData.append('message', message)
      if (counterEvidence) {
        counterEvidence.forEach((file, index) => {
          formData.append(`counter_evidence_${index}`, file)
        })
      }

      const response = await fetch(`/api/agreements/${resolvedParams.id}/respond-breach`, {
        method: "POST",
        credentials: "include",
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to respond to breach")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to respond to breach")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleEscalateToLegal = useCallback(async (reason: string, evidence?: File[]) => {
    try {
      const formData = new FormData()
      formData.append('reason', reason)
      if (evidence) {
        evidence.forEach((file, index) => {
          formData.append(`evidence_${index}`, file)
        })
      }

      const response = await fetch(`/api/agreements/${resolvedParams.id}/escalate-legal`, {
        method: "POST",
        credentials: "include",
        body: formData
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to escalate to legal")
      }
      
      await refreshAgreements()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to escalate to legal")
    }
  }, [resolvedParams.id, refreshAgreements])

  const handleResendExpired = useCallback(async (expirationDays?: number) => {
    try {
      const response = await fetch(`/api/agreements/${resolvedParams.id}/resend-expired`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expirationDays })
      })
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to resend expired agreement")
      }
      
      const data = await response.json()
      router.push(`/agreement/${data.newAgreementId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to resend expired agreement")
    }
  }, [resolvedParams.id, refreshAgreements, router])

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

      const safeTitle = agreement?.title ? agreement.title.replace(/[^a-z0-9-_]/gi, "_") : "agreement"
      pdf.save(`${safeTitle}-${resolvedParams.id}.pdf`)
    } catch (err) {
      console.error("PDF download failed", err)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDuplicate = useCallback(async () => {
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
  }, [resolvedParams.id, router])

  // ============================================
  // EARLY RETURN AFTER ALL HOOKS
  // ============================================
  if (!user || !agreement || !userContext || !actions) {
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

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
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
    if (!statusBadge) return "bg-muted text-muted-foreground"
    
    switch (statusBadge.color) {
      case "green":
        return "bg-green-500/10 text-green-400 border-green-500/20"
      case "blue":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      case "amber":
      case "yellow":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
      case "red":
        return "bg-red-500/10 text-red-400 border-red-500/20"
      case "orange":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20"
      case "purple":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"
      case "teal":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20"
      case "gray":
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20"
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

  const creatorInfo = agreement.user || { name: "Unknown Creator", email: "" }
  const isCreator = userContext.isCreator
  const isCounterparty = userContext.isCounterparty
  const isWitness = userContext.isWitness
  const sharedParticipants = agreement.sharedWith || []
  const counterparties = sharedParticipants.filter((p) => (p.role ?? "counterparty") === "counterparty")
  const designatedWitnesses = sharedParticipants.filter((p) => (p.role ?? "counterparty") === "witness")

  // Determine "Valid Until" date
  const validUntilDate =
    agreement.endDate ||
    agreement.deadline ||
    agreement.targetDate ||
    agreement.betSettlementDate

  const isWitnessOnly = isWitness && !isCreator && !isCounterparty

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Enhanced background with animated gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-950 to-purple-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-slate-950/50 to-slate-950" />
      </div>

      <main ref={contentRef} className="relative z-10 container mx-auto px-3 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Expiration Warning Banner */}
          {actions.warnings.expirationWarning && agreement.status === "pending_signature" && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-200">
              ⚠️ {actions.warnings.expirationWarning}
            </div>
          )}

          {/* Dispute Iteration Warning */}
          {actions.warnings.iterationLimitWarning && (
            <Card className="bg-orange-900/20 border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-300">Dispute Resolution Warning</p>
                    <p className="text-sm text-orange-200/80">{actions.warnings.iterationLimitWarning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <span className="capitalize">{agreement.type?.replace("-", " ") || "Agreement"}</span>
                  </Badge>
                  <Badge variant="outline" className={cn("capitalize px-4 py-2 text-sm font-semibold", getStatusColor())}>
                    <div className={cn(
                      "w-2 h-2 rounded-full mr-2",
                      ["active", "completed"].includes(agreement.status) ? "bg-green-400 animate-pulse" :
                      ["pending_signature", "pending_amendment", "pending_completion"].includes(agreement.status) ? "bg-yellow-400" :
                      ["disputed", "breach_reported", "legal_resolution"].includes(agreement.status) ? "bg-red-400 animate-pulse" :
                      "bg-gray-400"
                    )} />
                    {statusBadge?.label || agreement.status}
                  </Badge>
                  {agreement.legal && (
                    <Badge variant="outline" className="gap-2 bg-blue-500/10 text-blue-300 border-blue-500/30 px-4 py-2">
                      <Shield className="w-4 h-4" />
                      Legally Binding
                    </Badge>
                  )}
                  {/* Version badge for amended agreements */}
                  {agreement.version && agreement.version > 1 && (
                    <Badge variant="outline" className="gap-2 bg-teal-500/10 text-teal-300 border-teal-500/30 px-4 py-2">
                      <FileEdit className="w-4 h-4" />
                      v{agreement.versionString || agreement.version}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between sm:justify-end">
                  {actions.canDownloadReceipt && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto gap-2 bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-300"
                      onClick={handleDownloadPdf}
                      disabled={isDownloading}
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Preparing..." : "Download PDF"}
                    </Button>
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
              </div>
            </CardHeader>

            <CardContent className="space-y-8 relative p-4 sm:p-6">
              {/* Primary Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  {/* Primary action (most important) */}
                  {primaryAction && (
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => {
                        switch (primaryAction.action) {
                          case "send":
                            handleSendForSignature()
                            break
                          case "sign":
                            openCounterpartySignDialog()
                            break
                          case "review-amendment":
                            // Scroll to amendment panel
                            document.getElementById('amendment-panel')?.scrollIntoView({ behavior: 'smooth' })
                            break
                          case "confirm":
                            handleComplete()
                            break
                          case "complete":
                            handleComplete()
                            break
                          case "resend-expired":
                            handleResendExpired()
                            break
                        }
                      }}
                    >
                      {primaryAction.label}
                    </Button>
                  )}

                  {/* Secondary actions */}
                  {actions.canEdit && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={() => router.push(`/agreement/${resolvedParams.id}/edit`)}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Draft
                    </Button>
                  )}





                  {actions.canDuplicate && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-2"
                      onClick={handleDuplicate}
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </Button>
                  )}

                  {actions.canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="lg"
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Agreement?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this agreement. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Show reasons why actions are disabled */}
                {Object.entries(actions.reasons).map(([key, reason]) => reason && (
                  <div key={key} className="flex items-center gap-2 text-sm text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Enhanced Information Grid */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    Created
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">{formatDateTime(agreement.createdAt)}</p>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Valid Until
                  </div>
                  <p className="font-semibold text-white text-base sm:text-lg">
                    {validUntilDate ? (
                      formatDate(validUntilDate)
                    ) : agreement.expiresAt ? (
                      <span className="text-yellow-400">{formatDateTime(agreement.expiresAt)}</span>
                    ) : (
                      <span className="text-slate-500">Not set</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Participants Section */}
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
                      <p className="font-medium text-white">{counterparties[0].name || counterparties[0].email}</p>
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
              {/* Amendment Request Panel */}
              {agreement.status === "pending_amendment" && (
                <div id="amendment-panel">
                  <AmendmentRequestPanel
                    agreement={agreement}
                    onAccept={() => handleRespondToAmendment("accept")}
                    onDecline={(message) => handleRespondToAmendment("reject", message)}
                  />
                </div>
              )}



              {/* Dispute Resolution Panel */}
              {(agreement.status === "disputed" || agreement.status === "in_dispute") && (
                <DisputeResolutionPanel
                  agreement={agreement}
                  userId={user.id}
                  onAction={async (action, payload) => {
                    await performWorkflowAction(resolvedParams.id, action, payload)
                    await refreshAgreements()
                  }}
                />
              )}



              <AgreementDetailsBlock agreement={agreement} />
            </div>
            
            {/* Smart Action Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Quick Status Summary */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Status Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Current State</span>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor())}>
                        {statusBadge?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{statusBadge?.description}</p>
                    
                    {/* Show available transitions */}
                    {availableTransitions.length > 0 && (
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-xs text-slate-400 mb-2">Available Actions:</p>
                        <div className="space-y-1">
                          {availableTransitions.slice(0, 3).map((transition) => (
                            <div key={transition.action} className="text-xs text-slate-300">
                              • {transition.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Additional contextual panels based on state */}
                {agreement.status === "expired" && actions.canResendExpired && (
                  <Card className="bg-yellow-900/20 border-yellow-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-yellow-300 mb-2">Agreement Expired</p>
                          <p className="text-sm text-yellow-200/80 mb-3">
                            This agreement expired on {agreement.expiresAt && formatDateTime(agreement.expiresAt)}. Resend it with a new expiration date.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleResendExpired()}
                            className="w-full"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Resend Agreement
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
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
          agreementType={agreement.type || "general"}
          open={showCertificate}
          onOpenChange={setShowCertificate}
        />
      )}

      {/* Hidden trigger buttons for dialogs */}
      <div className="hidden">
        <button id={counterpartySignTriggerId} onClick={openCounterpartySignDialog} />
      </div>
    </div>
  )
}