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
  Scale,
  Ban,
  XCircle,
  Trash2,
  Edit3,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Agreement } from "@/lib/agreement-types"
import { type AvailableActions } from "@/lib/agreement-actions"
import { WithdrawDialog } from "@/components/agreement/dialogs/withdraw-dialog"
import { TerminateDialog } from "@/components/agreement/dialogs/terminate-dialog"
import { BreachReportDialog } from "@/components/agreement/dialogs/breach-report-dialog"
import { BreachResponseDialog } from "@/components/agreement/dialogs/breach-response-dialog"

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
  onDelete?: () => void
  onTerminate?: (reason: string) => Promise<void>
  onReportBreach?: (description: string, evidence?: File[]) => Promise<void>
  onRespondToBreach?: (responseType: string, message: string, evidence?: File[]) => Promise<void>
  counterpartySignTriggerId?: string
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
  onDelete,
  onTerminate,
  onReportBreach,
  onRespondToBreach,
  counterpartySignTriggerId,
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

    // PRIMARY ACTIONS (most important, shown first)
    
    // Send for signature (DRAFT -> PENDING_SIGNATURE)
    if (actions.canSendForSignature && onSendForSignature) {
      recommendations.push({
        type: "urgent",
        title: "Send for Signature",
        description: "Send this agreement to counterparty for signing",
        action: "Send",
        icon: Send,
        handler: onSendForSignature,
        group: "primary"
      })
    }

    // Counterparty sign (PENDING_SIGNATURE -> ACTIVE)
    if (actions.canSign) {
      recommendations.push({
        type: "urgent",
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
        },
        group: "primary"
      })
    }

    // Creator sign (ACTIVE, but creator hasn't signed yet)
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
        },
        group: "primary"
      })
    }

    // Request completion (ACTIVE -> PENDING_COMPLETION)
    if (actions.canRequestCompletion) {
      recommendations.push({
        type: "success",
        title: "Request Completion",
        description: "Mark this agreement as completed",
        action: "Complete",
        icon: CheckCircle,
        handler: onComplete,
        group: "primary"
      })
    }

    // Confirm completion (PENDING_COMPLETION -> COMPLETED)
    if (actions.canConfirmCompletion) {
      recommendations.push({
        type: "confirm",
        title: "Confirm Completion",
        description: "The other party has requested completion",
        action: "Confirm",
        icon: CheckCircle,
        handler: onComplete,
        group: "primary"
      })
    }

    // SECONDARY ACTIONS

    // Edit draft
    if (actions.canEdit && onEdit) {
      recommendations.push({
        type: "action",
        title: "Edit Agreement",
        description: "Make changes to the agreement draft",
        action: "Edit",
        icon: Edit3,
        handler: onEdit,
        group: "secondary"
      })
    }

    // Resend
    if (actions.canResend && onResend) {
      recommendations.push({
        type: "action",
        title: "Resend to Counterparty",
        description: "Send reminder to sign this agreement",
        action: "Resend",
        icon: RefreshCw,
        handler: onResend,
        group: "secondary"
      })
    }

    // Request amendment (use dialog component)
    if (actions.canRequestAmendment) {
      recommendations.push({
        type: "action",
        title: "Request Amendment",
        description: "Request changes to this active agreement",
        action: "Request Changes",
        icon: MessageSquare,
        handler: () => {}, // Dialog handles this
        group: "secondary",
        customComponent: (
          <AmendmentRequestDialog
            key="amendment-dialog"
            agreementId={agreement.id}
            agreementTitle={agreement.title}
            onSuccess={onRefresh}
            trigger={
              <Button size="sm" variant="outline" className="text-xs font-medium bg-blue-600 hover:bg-blue-700">
                Request Changes
              </Button>
            }
          />
        )
      })
    }

    // Report breach (use dialog component)
    if (actions.canReportBreach) {
      recommendations.push({
        type: "action",
        title: "Report Breach",
        description: "Report a violation of agreement terms",
        action: "Report Breach",
        icon: AlertTriangle,
        handler: () => {}, // Dialog handles this
        group: "secondary",
        customComponent: (
          <BreachReportDialog
            key="breach-report-dialog"
            agreementId={agreement.id}
            agreementTitle={agreement.title}
            onSuccess={onRefresh}
            trigger={
              <Button size="sm" variant="outline" className="text-xs font-medium border-red-500/30 text-red-300 hover:bg-red-500/10">
                Report Breach
              </Button>
            }
          />
        )
      })
    }

    // Reject signature
    if (actions.canReject && onReject) {
      recommendations.push({
        type: "action",
        title: "Reject Agreement",
        description: "Reject this agreement and request changes",
        action: "Reject",
        icon: XCircle,
        handler: onReject,
        group: "secondary"
      })
    }

    // Reject completion
    if (actions.canRejectCompletion && onWorkflowAction) {
      recommendations.push({
        type: "action",
        title: "Reject Completion",
        description: "Reject the completion request",
        action: "Reject Completion",
        icon: XCircle,
        handler: () => onWorkflowAction("REJECT_COMPLETION"),
        group: "secondary"
      })
    }

    // Download receipt
    if (actions.canDownloadReceipt && onDownloadReceipt) {
      recommendations.push({
        type: "success",
        title: "Download Receipt",
        description: "Download the completion receipt",
        action: "Download",
        icon: Download,
        handler: onDownloadReceipt,
        group: "secondary"
      })
    }

    // Duplicate
    if (actions.canDuplicate && onDuplicate) {
      recommendations.push({
        type: "action",
        title: "Duplicate Agreement",
        description: "Create a copy of this agreement",
        action: "Duplicate",
        icon: Copy,
        handler: onDuplicate,
        group: "secondary"
      })
    }

    // View audit
    if (actions.canViewAudit && onViewAudit) {
      recommendations.push({
        type: "action",
        title: "View Audit Log",
        description: "See all actions taken on this agreement",
        action: "View Audit",
        icon: Eye,
        handler: onViewAudit,
        group: "secondary"
      })
    }

    // Delete (hard delete for drafts)
    if (actions.canDelete && onDelete) {
      recommendations.push({
        type: "danger",
        title: "Delete Agreement",
        description: "Permanently delete this draft agreement",
        action: "Delete",
        icon: Trash2,
        handler: onDelete
      })
    }

    // Terminate active agreement
    if (actions.canTerminateAgreement && onTerminate) {
      recommendations.push({
        type: "danger",
        title: "Terminate Agreement",
        description: "End this active agreement",
        action: "Terminate",
        icon: XCircle,
        handler: () => {
          document.getElementById(`terminate-trigger-${agreement.id}`)?.click()
        }
      })
    }

    // Withdraw offer (before counterparty signs)
    if (actions.canWithdrawOffer && onWithdraw) {
      recommendations.push({
        type: "warning",
        title: "Withdraw Offer",
        description: "Cancel this offer before counterparty signs",
        action: "Withdraw",
        icon: Ban,
        handler: () => {
          document.getElementById(`withdraw-trigger-${agreement.id}`)?.click()
        }
      })
    }

    // Request amendment
    if (actions.canRequestAmendment && onWorkflowAction) {
      recommendations.push({
        type: "action",
        title: "Request Amendment",
        description: "Propose changes to the active agreement",
        action: "Request Changes",
        icon: Edit3,
        handler: () => onWorkflowAction("REQUEST_AMENDMENT")
      })
    }

    // Report breach
    if (actions.canReportBreach && onReportBreach) {
      recommendations.push({
        type: "warning",
        title: "Report Breach",
        description: "Report a violation of agreement terms",
        action: "Report",
        icon: AlertTriangle,
        handler: () => {
          document.getElementById(`breach-report-trigger-${agreement.id}`)?.click()
        }
      })
    }

    // Resend reminder
    if (actions.canResend && onWorkflowAction) {
      recommendations.push({
        type: "action",
        title: "Resend Reminder",
        description: "Send a reminder to the counterparty",
        action: "Resend",
        icon: Send,
        handler: () => onWorkflowAction("RESEND_REMINDER")
      })
    }

    // Withdraw (legacy - keeping for backwards compatibility)
    if (isCreator && counterpartySignatures.length === 0 && onWithdraw && agreement.status !== "withdrawn" && !actions.canWithdrawOffer) {
      recommendations.push({
        type: "action",
        title: "Withdraw Offer",
        description: "Withdraw this offer before counterparty signs",
        action: "Withdraw",
        icon: Ban,
        handler: () => {}, // Dialog handles this
        group: "danger",
        customComponent: (
          <WithdrawDialog
            key="withdraw-dialog"
            agreementId={agreement.id}
            agreementTitle={agreement.title}
            onSuccess={onRefresh}
            trigger={
              <Button size="sm" variant="outline" className="text-xs font-medium border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10">
                Withdraw
              </Button>
            }
          />
        )
      })
    }

    // Terminate agreement (use dialog component)
    if (actions.canTerminateAgreement) {
      recommendations.push({
        type: "urgent",
        title: "Terminate Agreement",
        description: "Terminate this active agreement",
        action: "Terminate",
        icon: XCircle,
        handler: () => {}, // Dialog handles this
        group: "danger",
        customComponent: (
          <TerminateDialog
            key="terminate-dialog"
            agreementId={agreement.id}
            agreementTitle={agreement.title}
            onSuccess={onRefresh}
            trigger={
              <Button size="sm" variant="destructive" className="text-xs font-medium">
                Terminate
              </Button>
            }
          />
        )
      })
    }

    // Cancel agreement
    if (actions.canCancel && onCancel) {
      recommendations.push({
        type: "action",
        title: "Cancel Agreement",
        description: "Cancel this agreement before counterparty signs",
        action: "Cancel",
        icon: XCircle,
        handler: onCancel,
        group: "danger"
      })
    }

    // Delete agreement
    if (actions.canDelete && onDelete) {
      recommendations.push({
        type: "action",
        title: "Delete Agreement",
        description: "Permanently delete this agreement",
        action: "Delete",
        icon: AlertTriangle,
        handler: onDelete,
        group: "danger"
      })
    }

    // Raise dispute (legacy)
    if (actions.canRaiseDispute && onWorkflowAction) {
      recommendations.push({
        type: "urgent",
        title: "Raise Dispute",
        description: "Initiate a dispute resolution process",
        action: "Dispute",
        icon: Scale,
        handler: () => onWorkflowAction("RAISE_DISPUTE"),
        group: "danger"
      })
    }

    // Special case: Dispute handling
    if (agreement.status === "active" && agreement.rejectedBy && agreement.rejectedBy !== userId && onWorkflowAction) {
      recommendations.push({
        type: "confirm",
        title: "Rejection Received",
        description: "The other party rejected completion. You can accept or dispute it.",
        action: "Dispute",
        icon: AlertTriangle,
        handler: () => onWorkflowAction("DISPUTE_REJECTION"),
        group: "primary"
      })
    }

    if (agreement.status === "disputed" && agreement.disputePhase === "deadlock" && onWorkflowAction) {
      recommendations.push({
        type: "urgent",
        title: "Legal Resolution",
        description: "Negotiation has reached a deadlock. Consider legal resolution.",
        action: "Escalate",
        icon: Scale,
        handler: () => onWorkflowAction("ESCALATE_LEGAL"),
        group: "primary"
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  // Group recommendations
  const primaryActions = recommendations.filter(r => r.group === "primary")
  const secondaryActions = recommendations.filter(r => r.group === "secondary")
  const dangerActions = recommendations.filter(r => r.group === "danger")

  // Show action disabled reasons and warnings
  const hasReasons = Object.values(actions.reasons).some(r => r)
  const hasWarnings = Object.values(actions.warnings).some(w => w)

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
        {/* Warnings */}
        {hasWarnings && (
          <div className="space-y-2">
            {Object.entries(actions.warnings).map(([key, warning]) => warning && (
              <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {/* Disabled reasons */}
        {hasReasons && (
          <div className="space-y-2">
            {Object.entries(actions.reasons).map(([key, reason]) => reason && (
              <div key={key} className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{reason}</span>
              </div>
            ))}
          </div>
        )}

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

        {/* Primary Actions */}
        {primaryActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              Primary Actions
            </h4>
            {primaryActions.map((rec, index) => {
              if (rec.customComponent) {
                return <div key={index}>{rec.customComponent}</div>
              }
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

        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Additional Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {secondaryActions.map((rec, index) => {
                if (rec.customComponent) {
                  return <div key={index}>{rec.customComponent}</div>
                }
                const Icon = rec.icon
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs gap-2"
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
                    <Icon className="w-3 h-3" />
                    {rec.action}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Danger Actions */}
        {dangerActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Danger Zone
            </h4>
            <div className="flex flex-wrap gap-2">
              {dangerActions.map((rec, index) => {
                if (rec.customComponent) {
                  return <div key={index}>{rec.customComponent}</div>
                }
                const Icon = rec.icon
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs gap-2 border-red-500/30 text-red-300 hover:bg-red-500/10"
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
                    <Icon className="w-3 h-3" />
                    {rec.action}
                  </Button>
                )
              })}
            </div>
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

      {/* Dialog Components - Conditionally rendered */}
      {actions.canWithdrawOffer && onWithdraw && (
        <WithdrawDialog
          agreementId={agreement.id}
          onWithdraw={onWithdraw}
          triggerId={`withdraw-trigger-${agreement.id}`}
        />
      )}

      {actions.canTerminateAgreement && onTerminate && (
        <TerminateDialog
          agreementId={agreement.id}
          onTerminate={onTerminate}
          triggerId={`terminate-trigger-${agreement.id}`}
        />
      )}

      {actions.canReportBreach && onReportBreach && (
        <BreachReportDialog
          agreementId={agreement.id}
          onReport={onReportBreach}
          triggerId={`breach-report-trigger-${agreement.id}`}
        />
      )}

      {onRespondToBreach && (
        <BreachResponseDialog
          agreementId={agreement.id}
          breachId={agreement.id}
          onRespond={async (responseType, message, evidence) => {
            await onRespondToBreach(responseType, message, evidence)
          }}
          triggerId={`breach-response-trigger-${agreement.id}`}
        />
      )}
    </Card>
  )
}
