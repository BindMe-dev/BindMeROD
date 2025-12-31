"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Shield, 
  AlertTriangle, 
  Zap, 
  TrendingUp,
  Calendar,
  FileText,
  Star,
  Target,
  Activity,
  Scale
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agreement } from "@/lib/agreement-types"
import { type AvailableActions } from "@/lib/agreement-actions"

interface SmartActionPanelProps {
  agreement: Agreement
  userId: string
  isCreator: boolean
  isCounterpartyUser: boolean
  actions: AvailableActions
  counterpartySignatures: any[]
  onComplete: () => void
  onSignAsCounterparty: () => void
  onSignAsCreator?: () => void
  onEdit?: () => void
  onSendForSignature?: () => void
  onCancel?: () => void
  onReject?: () => void
  onWithdraw?: () => void
  onWorkflowAction?: (action: string, payload?: any) => Promise<void>
  onDownloadReceipt?: () => void
  onDuplicate?: () => void
  onViewAudit?: () => void
  counterpartySignTriggerId?: string
  creatorSignTriggerId?: string
}

export function SmartActionPanel({
  agreement,
  userId,
  isCreator,
  isCounterpartyUser,
  actions,
  counterpartySignatures,
  onComplete,
  onSignAsCounterparty,
  onSignAsCreator,
  onEdit,
  onSendForSignature,
  onCancel,
  onReject,
  onWithdraw,
  onWorkflowAction,
  onDownloadReceipt,
  onDuplicate,
  onViewAudit,
  counterpartySignTriggerId,
  creatorSignTriggerId,
}: SmartActionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Calculate completion progress
  const getCompletionProgress = () => {
    let progress = 0
    let steps = []

    // Step 1: Agreement created
    steps.push({ label: "Agreement Created", completed: true, icon: FileText })
    progress += 25

    // Step 2: Counterparty signed
    if (counterpartySignatures.length > 0) {
      steps.push({ label: "Counterparty Signed", completed: true, icon: Users })
      progress += 25
    } else {
      steps.push({ label: "Awaiting Counterparty Signature", completed: false, icon: Users })
    }

    // Step 3: Agreement active
    if (agreement.status === "active" && counterpartySignatures.length > 0) {
      steps.push({ label: "Agreement Active", completed: true, icon: Activity })
      progress += 25
    } else {
      steps.push({ label: "Agreement Activation", completed: false, icon: Activity })
    }

    // Step 4: Completion
    if (agreement.status === "completed") {
      steps.push({ label: "Agreement Completed", completed: true, icon: CheckCircle })
      progress += 25
    } else {
      steps.push({ label: "Awaiting Completion", completed: false, icon: CheckCircle })
    }

    return { progress, steps }
  }

  const { progress, steps } = getCompletionProgress()

  // Get smart recommendations based on available actions
  const getRecommendations = () => {
    const recommendations = []

    // Edit action
    if (actions.canEdit && onEdit) {
      recommendations.push({
        type: "action",
        title: "Edit Agreement",
        description: "Make changes to the agreement draft",
        action: "Edit",
        icon: FileText,
        handler: onEdit
      })
    }

    // Send for signature
    if (actions.canSendForSignature && onSendForSignature) {
      recommendations.push({
        type: "urgent",
        title: "Send for Signature",
        description: "Send this agreement to counterparty for signing",
        action: "Send",
        icon: Users,
        handler: onSendForSignature
      })
    }

    // Creator sign
    if (actions.canCreatorSign && onSignAsCreator) {
      recommendations.push({
        type: "action",
        title: "Sign Agreement",
        description: "Add your signature to this agreement",
        action: "Sign as Creator",
        icon: Shield,
        handler: () => {
          if (creatorSignTriggerId) {
            document.getElementById(creatorSignTriggerId)?.click()
          } else if (onSignAsCreator) {
            onSignAsCreator()
          }
        }
      })
    }

    // Counterparty sign
    if (actions.canSign) {
      recommendations.push({
        type: "action",
        title: "Sign Agreement",
        description: "Review and sign this agreement to make it active",
        action: "Sign Now",
        icon: Shield,
        handler: () => {
          if (counterpartySignTriggerId) {
            document.getElementById(counterpartySignTriggerId)?.click()
          } else {
            onSignAsCounterparty()
          }
        }
      })
    }

    // Reject signature
    if (actions.canReject && onReject) {
      recommendations.push({
        type: "action",
        title: "Reject Agreement",
        description: "Reject this agreement and request changes",
        action: "Reject",
        icon: AlertTriangle,
        handler: onReject
      })
    }

    // Cancel agreement
    if (actions.canCancel && onCancel) {
      recommendations.push({
        type: "action",
        title: "Cancel Agreement",
        description: "Cancel this agreement before counterparty signs",
        action: "Cancel",
        icon: AlertTriangle,
        handler: onCancel
      })
    }

    // Request completion
    if (actions.canRequestCompletion) {
      recommendations.push({
        type: "success",
        title: "Request Completion",
        description: "Mark this agreement as completed",
        action: "Complete",
        icon: CheckCircle,
        handler: onComplete
      })
    }

    // Confirm completion
    if (actions.canConfirmCompletion) {
      recommendations.push({
        type: "confirm",
        title: "Confirm Completion",
        description: "The other party has requested completion",
        action: "Confirm",
        icon: CheckCircle,
        handler: onComplete
      })
    }

    // Reject completion
    if (actions.canRejectCompletion && onWorkflowAction) {
      recommendations.push({
        type: "action",
        title: "Reject Completion",
        description: "Reject the completion request",
        action: "Reject Completion",
        icon: AlertTriangle,
        handler: () => onWorkflowAction("REJECT_COMPLETION")
      })
    }

    // Raise dispute
    if (actions.canRaiseDispute && onWorkflowAction) {
      recommendations.push({
        type: "urgent",
        title: "Raise Dispute",
        description: "Initiate a dispute resolution process",
        action: "Dispute",
        icon: Scale,
        handler: () => onWorkflowAction("RAISE_DISPUTE")
      })
    }

    // Download receipt
    if (actions.canDownloadReceipt && onDownloadReceipt) {
      recommendations.push({
        type: "success",
        title: "Download Receipt",
        description: "Download the completion receipt",
        action: "Download",
        icon: CheckCircle,
        handler: onDownloadReceipt
      })
    }

    // Duplicate
    if (actions.canDuplicate && onDuplicate) {
      recommendations.push({
        type: "action",
        title: "Duplicate Agreement",
        description: "Create a copy of this agreement",
        action: "Duplicate",
        icon: FileText,
        handler: onDuplicate
      })
    }

    // View audit
    if (actions.canViewAudit && onViewAudit) {
      recommendations.push({
        type: "action",
        title: "View Audit Log",
        description: "See all actions taken on this agreement",
        action: "View Audit",
        icon: Activity,
        handler: onViewAudit
      })
    }

    // Withdraw (legacy)
    if (isCreator && counterpartySignatures.length === 0 && onWithdraw && agreement.status !== "withdrawn") {
      recommendations.push({
        type: "action",
        title: "Withdraw Agreement",
        description: "Remove this agreement before any signatures are collected",
        action: "Withdraw",
        icon: AlertTriangle,
        handler: onWithdraw
      })
    }

    // Dispute handling
    if (agreement.status === "active" && agreement.rejectedBy && agreement.rejectedBy !== userId && onWorkflowAction) {
      recommendations.push({
        type: "confirm",
        title: "Rejection Received",
        description: "The other party rejected completion. You can accept or dispute it.",
        action: "Dispute",
        icon: AlertTriangle,
        handler: () => onWorkflowAction("DISPUTE_REJECTION")
      })
    }

    if (agreement.status === "disputed" && agreement.disputePhase === "deadlock" && onWorkflowAction) {
      recommendations.push({
        type: "urgent",
        title: "Legal Resolution",
        description: "Negotiation has reached a deadlock. Consider legal resolution.",
        action: "Escalate",
        icon: Scale,
        handler: () => onWorkflowAction("ESCALATE_LEGAL")
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700 backdrop-blur-xl shadow-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Smart Actions</CardTitle>
              <p className="text-slate-400 text-sm">AI-powered recommendations</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">
            {progress}% Complete
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Tracker */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Agreement Progress</span>
            <span className="text-sm text-slate-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-800" />
          
          <div className="grid grid-cols-2 gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all duration-300",
                    step.completed
                      ? "bg-green-500/10 border-green-500/30 text-green-300"
                      : "bg-slate-800/50 border-slate-700 text-slate-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{step.label}</span>
                  {step.completed && <CheckCircle className="w-3 h-3 ml-auto" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Recommended Actions
            </h4>
            {recommendations.map((rec, index) => {
              const Icon = rec.icon
              return (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02]",
                    rec.type === "urgent" && "bg-red-500/10 border-red-500/30",
                    rec.type === "action" && "bg-blue-500/10 border-blue-500/30",
                    rec.type === "success" && "bg-green-500/10 border-green-500/30",
                    rec.type === "confirm" && "bg-yellow-500/10 border-yellow-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      rec.type === "urgent" && "bg-red-500/20",
                      rec.type === "action" && "bg-blue-500/20",
                      rec.type === "success" && "bg-green-500/20",
                      rec.type === "confirm" && "bg-yellow-500/20"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-white text-sm mb-1">{rec.title}</h5>
                      <p className="text-xs text-slate-400 mb-3">{rec.description}</p>
                      <Button
                        size="sm"
                        className={cn(
                          "text-xs font-medium",
                          rec.type === "urgent" && "bg-red-600 hover:bg-red-700",
                          rec.type === "action" && "bg-blue-600 hover:bg-blue-700",
                          rec.type === "success" && "bg-green-600 hover:bg-green-700",
                          rec.type === "confirm" && "bg-yellow-600 hover:bg-yellow-700"
                        )}
                        onClick={async () => {
                          try {
                            if (rec.handler) {
                              await rec.handler()
                            }
                          } catch (err) {
                            alert(err instanceof Error ? err.message : "Action failed")
                          }
                        }}
                      >
                        {rec.action}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{agreement.type === "recurring" ? agreement.completions?.length || 0 : 1}</div>
            <div className="text-xs text-slate-400">Occurrences</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{counterpartySignatures.length + (agreement.legal?.signatures?.filter(s => s.role === "creator").length || 0)}</div>
            <div className="text-xs text-slate-400">Signatures</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.ceil((new Date().getTime() - new Date(agreement.createdAt).getTime()) / (1000 * 60 * 60 * 24))}</div>
            <div className="text-xs text-slate-400">Days Active</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
