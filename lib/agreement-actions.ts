
/**
 * Enhanced Agreement Action Permissions
 * 
 * Reflects complete state machine including:
 * - Amendment workflow (PENDING_AMENDMENT state)
 * - Creator withdrawal (WITHDRAWN state)
 * - Expiration handling (EXPIRED state)
 * - Dispute resolution paths
 * - Multi-step completion workflow
 * 
 * Core principle: Buttons controlled by (agreement_state + user_role + user_is_party + time_constraints)
 */

import type { Agreement, AgreementStatus } from "./agreement-types"

export interface UserContext {
  userId: string
  email: string
  isCreator: boolean
  isCounterparty: boolean
  isWitness: boolean
  hasSignedAsCounterparty: boolean
  hasSignedAsWitness: boolean
  isAdmin: boolean // For legal resolution actions
}

export interface AvailableActions {
  // Draft phase (creator only)
  canEdit: boolean
  canSendForSignature: boolean
  canSetExpiration: boolean
  canCancelDraft: boolean // Hard delete
  canDelete: boolean // Hard delete from DB

  // Signature phase
  canSign: boolean
  canCreatorSign: boolean
  canReject: boolean
  canWithdrawOffer: boolean // NEW: Creator withdraws before counterparty signs
  canCancel: boolean // Creator cancels/revises
  canResend: boolean // Remind counterparty
  
  // Active phase
  canRequestCompletion: boolean
  canConfirmCompletion: boolean
  canRejectCompletion: boolean
  canRaiseDispute: boolean
  canRequestAmendment: boolean // NEW: Request changes to active agreement
  canTerminateAgreement: boolean // NEW: Creator soft-deletes (→ CANCELLED)
  canReportBreach: boolean
  canWithdrawBreachReport: boolean
  
  // Amendment phase (PENDING_AMENDMENT)
  canAcceptAmendment: boolean // NEW: Reviewing party accepts
  canRejectAmendment: boolean // NEW: Reviewing party rejects
  canCounterProposeAmendment: boolean // NEW: Reviewing party suggests alternative
  canCancelAmendmentRequest: boolean // NEW: Proposing party cancels
  canReviseAmendment: boolean // NEW: Proposing party edits proposal
  canDiscussAmendment: boolean // NEW: Open comment thread
  
  // Breach/Dispute phase
  canProvideEvidence: boolean
  canProvideCounterEvidence: boolean
  canDisputeRejection: boolean // Other party disputes breach claim
  canAcknowledgeBreach: boolean // Other party admits breach
  canEscalateImmediately: boolean // Escalate to legal right away
  canEscalateToLegal: boolean // Escalate after deadlock
  canProposeResolution: boolean
  canAcceptResolution: boolean
  canRequestMediation: boolean
  
  // Legal resolution phase
  canSubmitCounterProposal: boolean // Counter-proposal to return to IN_DISPUTE
  canMarkSettled: boolean // Admin/mutual action
  canMarkTerminated: boolean // Admin/mutual action
  canUploadLegalDocuments: boolean
  
  // Expired state
  canResendExpired: boolean // NEW: Resend expired agreement as new draft
  
  // Universal actions
  canDuplicate: boolean
  canViewAudit: boolean
  canDownloadReceipt: boolean
  canExportPDF: boolean
  canAddComments: boolean
  canViewHistory: boolean
  canViewVersions: boolean // NEW: See amendment history
  
  // Status reasons (why actions are disabled)
  reasons: {
    cannotEdit?: string
    cannotSign?: string
    cannotSendForSignature?: string
    cannotRequestCompletion?: string
    cannotRequestAmendment?: string
    cannotWithdraw?: string
    cannotTerminate?: string
  }
  
  // Time-based warnings
  warnings: {
    expirationWarning?: string // "Expires in 2 days"
    overdueWarning?: string
    iterationLimitWarning?: string // "4 of 5 dispute iterations used"
  }
}

/**
 * Calculate which actions are available for a user on a specific agreement
 */
export function getAvailableActions(
  agreement: Agreement,
  user: UserContext
): AvailableActions {
  const status = agreement.status
  const allSignatures = agreement.legalSignatures || agreement.legal?.signatures || []
  const counterpartySignatures = allSignatures.filter(s => s.role === "counterparty")
  const creatorSigned = allSignatures.some(s => s.role === "creator")
  
  // Check expiration
  const now = new Date()
  const expiresAt = agreement.expiresAt ? new Date(agreement.expiresAt) : null
  const isExpired = expiresAt && expiresAt < now
  const timeUntilExpiration = expiresAt ? expiresAt.getTime() - now.getTime() : null
  const daysUntilExpiration = timeUntilExpiration ? Math.ceil(timeUntilExpiration / (1000 * 60 * 60 * 24)) : null
  
  // Check dispute iterations
  const disputeIterations = agreement.disputeHistory?.length || 0
  const maxDisputeIterations = 5
  
  // Check who proposed amendment
  const userProposedAmendment = agreement.amendmentProposedBy === user.userId
  
  // Check who requested completion
  const userRequestedCompletion = agreement.completionRequestedBy === user.userId
  
  // Check who reported breach
  const userReportedBreach = agreement.breachReportedBy === user.userId
  
  const actions: AvailableActions = {
    canEdit: false,
    canSendForSignature: false,
    canSetExpiration: false,
    canCancelDraft: false,
    canDelete: false,
    canSign: false,
    canCreatorSign: false,
    canReject: false,
    canWithdrawOffer: false,
    canCancel: false,
    canResend: false,
    canRequestCompletion: false,
    canConfirmCompletion: false,
    canRejectCompletion: false,
    canRaiseDispute: false,
    canRequestAmendment: false,
    canTerminateAgreement: false,
    canReportBreach: false,
    canWithdrawBreachReport: false,
    canAcceptAmendment: false,
    canRejectAmendment: false,
    canCounterProposeAmendment: false,
    canCancelAmendmentRequest: false,
    canReviseAmendment: false,
    canDiscussAmendment: false,
    canProvideEvidence: false,
    canProvideCounterEvidence: false,
    canDisputeRejection: false,
    canAcknowledgeBreach: false,
    canEscalateImmediately: false,
    canEscalateToLegal: false,
    canProposeResolution: false,
    canAcceptResolution: false,
    canRequestMediation: false,
    canSubmitCounterProposal: false,
    canMarkSettled: false,
    canMarkTerminated: false,
    canUploadLegalDocuments: false,
    canResendExpired: false,
    canDuplicate: true,
    canViewAudit: user.isCreator || user.isCounterparty,
    canDownloadReceipt: false,
    canExportPDF: true,
    canAddComments: user.isCreator || user.isCounterparty,
    canViewHistory: true,
    canViewVersions: (agreement.version || 1) > 1,
    reasons: {},
    warnings: {}
  }

  // Add expiration warnings
  if (expiresAt && !isExpired && daysUntilExpiration !== null) {
    if (daysUntilExpiration <= 1) {
      actions.warnings.expirationWarning = `Expires in ${daysUntilExpiration} day${daysUntilExpiration !== 1 ? 's' : ''}`
    } else if (daysUntilExpiration <= 7) {
      actions.warnings.expirationWarning = `Expires in ${daysUntilExpiration} days`
    }
  }
  
  // Add dispute iteration warnings
  if (status === "disputed" || status === "breach_reported") {
    if (disputeIterations >= maxDisputeIterations - 1) {
      actions.warnings.iterationLimitWarning = `${disputeIterations} of ${maxDisputeIterations} iterations used - legal resolution next`
    } else if (disputeIterations >= maxDisputeIterations - 2) {
      actions.warnings.iterationLimitWarning = `${disputeIterations} of ${maxDisputeIterations} iterations used`
    }
  }

  // ========================================
  // STATE: DRAFT
  // ========================================
  if (status === "draft") {
    if (user.isCreator) {
      actions.canEdit = true
      actions.canSetExpiration = true
      actions.canSendForSignature = (agreement.sharedWith?.length ?? 0) > 0
      actions.canCancelDraft = true
      actions.canDelete = true // Hard delete in DRAFT

      if (!actions.canSendForSignature) {
        actions.reasons.cannotSendForSignature = "Add at least one counterparty first"
      }
    }
  }

  // ========================================
  // STATE: PENDING_SIGNATURE
  // ========================================
  else if (status === "pending_signature") {
    // Auto-expire check
    if (isExpired) {
      // Agreement should transition to EXPIRED state
      // UI should show "Agreement expired" message
      actions.reasons.cannotSign = "This agreement has expired"
      
    }

    if (user.isCreator) {
      // Creator can withdraw before anyone signs
      actions.canWithdrawOffer = counterpartySignatures.length === 0
      actions.canCancel = counterpartySignatures.length === 0 // Revise & resend
      actions.canResend = !isExpired
      actions.canDelete = true // Hard delete from database

      if (counterpartySignatures.length > 0) {
        actions.reasons.cannotWithdraw = "Counterparty has already signed"
      }
      
      if (isExpired) {
        actions.reasons.cannotWithdraw = "Agreement has expired"
      }
    }

    if (user.isCounterparty && !user.hasSignedAsCounterparty) {
      actions.canSign = !isExpired
      actions.canReject = !isExpired
      
      if (isExpired) {
        actions.reasons.cannotSign = "This agreement has expired"
      }
    } else if (user.hasSignedAsCounterparty) {
      actions.reasons.cannotSign = "You have already signed this agreement"
    }
  }

  // ========================================
  // STATE: ACTIVE
  // ========================================
  else if (status === "active") {
    if (user.isCreator && !creatorSigned) {
      actions.canCreatorSign = true
    }
    
    // Both parties can perform these actions
    if (user.isCreator || user.isCounterparty) {
      actions.canRequestCompletion = !agreement.completionRequestedBy
      actions.canRequestAmendment = true // NEW: Request changes to active agreement
      actions.canReportBreach = !agreement.breachReportedBy
      actions.canDownloadReceipt = true
      actions.canExportPDF = true

      if (!actions.canRequestCompletion) {
        actions.reasons.cannotRequestCompletion = "Completion already requested - awaiting confirmation"
      }
      
      if (!actions.canReportBreach) {
        actions.reasons.cannotRequestAmendment = "Cannot amend while breach is being investigated"
      }
    }
    
    // Creator-only actions in ACTIVE
    if (user.isCreator) {
      actions.canTerminateAgreement = true // Soft delete → CANCELLED
    }
  }

  // ========================================
  // STATE: PENDING_AMENDMENT (NEW)
  // ========================================
  else if (status === "pending_amendment") {
    if (user.isCreator && !creatorSigned) {
      actions.canCreatorSign = true
    }
    
    actions.canDiscussAmendment = true // Both parties can comment
    
    if (userProposedAmendment) {
      // Proposing party actions
      actions.canCancelAmendmentRequest = true
      actions.canReviseAmendment = true
    } else if (user.isCreator || user.isCounterparty) {
      // Reviewing party actions
      actions.canAcceptAmendment = true
      actions.canRejectAmendment = true
      actions.canCounterProposeAmendment = true
    }
  }

  // ========================================
  // STATE: PENDING_COMPLETION
  // ========================================
  else if (status === "pending_completion") {
    if (user.isCreator && !creatorSigned) {
      actions.canCreatorSign = true
    }
    
    if (user.isCreator || user.isCounterparty) {
      // The person who didn't request can confirm or reject
      const didUserRequest = userRequestedCompletion

      if (!didUserRequest) {
        actions.canConfirmCompletion = true
        actions.canRejectCompletion = true
      } else {
        actions.reasons.cannotRequestCompletion = "Awaiting confirmation from the other party"
      }
    }
  }

  // ========================================
  // STATE: BREACH_REPORTED (NEW)
  // ========================================
  else if (status === "breach_reported") {
    if (user.isCreator || user.isCounterparty) {
      actions.canProvideEvidence = true
      actions.canEscalateToLegal = disputeIterations >= 2 // After some back-and-forth
      
      if (userReportedBreach) {
        // Reporting party actions
        actions.canWithdrawBreachReport = true
        actions.canEscalateImmediately = true
      } else {
        // Other party actions
        actions.canDisputeRejection = (agreement.disputeRejectionAttempts || 0) < 2
        actions.canAcknowledgeBreach = true // Skip to resolution
        actions.canProvideCounterEvidence = true
      }
    }
  }

  // ========================================
  // STATE: IN_DISPUTE / DISPUTED (NEW)
  // ========================================
  else if (status === "disputed" || status === "in_dispute") {
    if (user.isCreator || user.isCounterparty) {
      actions.canProvideEvidence = true
      actions.canProposeResolution = disputeIterations < maxDisputeIterations
      actions.canAcceptResolution = agreement.hasProposedResolution || false
      actions.canRequestMediation = true
      actions.canEscalateToLegal = disputeIterations >= maxDisputeIterations - 1
      
      if (disputeIterations >= maxDisputeIterations) {
        actions.reasons.cannotRequestAmendment = "Maximum dispute iterations reached - escalate to legal resolution"
      }
    }
  }

  // ========================================
  // STATE: LEGAL_RESOLUTION (NEW)
  // ========================================
  else if (status === "legal_resolution") {
    // Limited actions - mostly read-only
    actions.canEdit = false
    actions.canProvideEvidence = true
    actions.canUploadLegalDocuments = user.isCreator || user.isCounterparty
    
    // Counter-proposals can go back to IN_DISPUTE if under 5 iterations
    if (disputeIterations < maxDisputeIterations) {
      actions.canSubmitCounterProposal = user.isCreator || user.isCounterparty
    }
    
    // Admin or mutual actions to resolve
    if (user.isAdmin) {
      actions.canMarkSettled = true
      actions.canMarkTerminated = true
    }
    
    actions.reasons.cannotEdit = "Agreement is in legal resolution - frozen state"
    actions.reasons.cannotRequestCompletion = "Agreement is in legal resolution"
  }

  // ========================================
  // STATE: COMPLETED
  // ========================================
  else if (status === "completed") {
    actions.canDownloadReceipt = true
    actions.canExportPDF = true
  }

  // ========================================
  // STATE: REJECTED
  // ========================================
  else if (status === "rejected") {
    if (user.isCreator) {
      actions.canDuplicate = true // Can create revised version
    }
  }

  // ========================================
  // STATE: WITHDRAWN (NEW)
  // ========================================
  else if (status === "withdrawn") {
    if (user.isCreator) {
      actions.canDuplicate = true // Can recreate if needed
    }
  }

  // ========================================
  // STATE: CANCELLED
  // ========================================
  else if (status === "cancelled") {
    if (user.isCreator) {
      actions.canDuplicate = true // Can recreate
    }
  }

  // ========================================
  // STATE: EXPIRED (NEW)
  // ========================================
  else if (status === "expired") {
    if (user.isCreator) {
      actions.canResendExpired = true // Creates new draft copy with updated expiration
      actions.canDuplicate = true
    }
    actions.reasons.cannotSign = "This agreement has expired"
  }

  return actions
}

/**
 * Get status badge properties (color, label, description)
 */
export function getStatusBadge(status: AgreementStatus): {
  variant: "default" | "secondary" | "destructive" | "outline" | "warning"
  label: string
  description: string
  color?: string
} {
  switch (status) {
    case "draft":
      return {
        variant: "outline",
        label: "Draft",
        description: "Creator is still editing",
        color: "gray"
      }
    case "pending_signature":
      return {
        variant: "warning",
        label: "Awaiting Signature",
        description: "Sent to counterparty for signature",
        color: "amber"
      }
    case "active":
      return {
        variant: "default",
        label: "Active",
        description: "Agreement is legally binding",
        color: "green"
      }
    case "pending_amendment":
      return {
        variant: "secondary",
        label: "Amendment Pending",
        description: "Proposed changes awaiting approval",
        color: "teal"
      }
    case "pending_completion":
    case "pending":
      return {
        variant: "secondary",
        label: "Pending Completion",
        description: "Awaiting completion confirmation",
        color: "purple"
      }
    case "completed":
      return {
        variant: "default",
        label: "Completed",
        description: "Agreement fulfilled successfully",
        color: "green"
      }
    case "rejected":
      return {
        variant: "destructive",
        label: "Rejected",
        description: "Counterparty rejected the agreement",
        color: "orange-red"
      }
    case "withdrawn":
      return {
        variant: "outline",
        label: "Withdrawn",
        description: "Creator withdrew offer before signature",
        color: "gray-orange"
      }
    case "cancelled":
      return {
        variant: "outline",
        label: "Cancelled",
        description: "Agreement terminated",
        color: "gray"
      }
    case "expired":
      return {
        variant: "outline",
        label: "Expired",
        description: "Signature deadline passed",
        color: "gray-yellow"
      }
    case "overdue":
      return {
        variant: "destructive",
        label: "Overdue",
        description: "Past deadline",
        color: "red"
      }
    case "breach_reported":
      return {
        variant: "destructive",
        label: "Breach Reported",
        description: "Under investigation",
        color: "red"
      }
    case "disputed":
    case "in_dispute":
      return {
        variant: "warning",
        label: "In Dispute",
        description: "Negotiation in progress",
        color: "orange"
      }
    case "legal_resolution":
      return {
        variant: "destructive",
        label: "Legal Resolution",
        description: "Escalated to legal process",
        color: "dark-red"
      }
    default:
      return {
        variant: "outline",
        label: "Unknown",
        description: "Status unknown",
        color: "gray"
      }
  }
}

/**
 * Get primary action button for current state
 */
export function getPrimaryAction(
  agreement: Agreement,
  user: UserContext
): {
  label: string
  action: string
  variant: "default" | "destructive" | "outline" | "secondary"
  icon?: string
} | null {
  const actions = getAvailableActions(agreement, user)
  
  // Priority order of actions
  if (actions.canSendForSignature) {
    return { 
      label: "Send for Signature", 
      action: "send", 
      variant: "default",
      icon: "send"
    }
  }
  if (actions.canSign) {
    return { 
      label: "Review & Sign", 
      action: "sign", 
      variant: "default",
      icon: "pen"
    }
  }
  if (actions.canAcceptAmendment) {
    return { 
      label: "Review Amendment", 
      action: "review-amendment", 
      variant: "default",
      icon: "file-diff"
    }
  }
  if (actions.canConfirmCompletion) {
    return { 
      label: "Confirm Completion", 
      action: "confirm", 
      variant: "default",
      icon: "check-circle"
    }
  }
  if (actions.canRequestCompletion) {
    return { 
      label: "Request Completion", 
      action: "complete", 
      variant: "default",
      icon: "flag"
    }
  }
  if (actions.canResendExpired) {
    return { 
      label: "Resend Agreement", 
      action: "resend-expired", 
      variant: "secondary",
      icon: "refresh"
    }
  }
  
  return null
}

/**
 * Get all state transitions available from current state
 */
export function getAvailableStateTransitions(
  agreement: Agreement,
  user: UserContext
): Array<{
  targetState: AgreementStatus
  action: string
  label: string
  requiresInput: boolean
  confirmationMessage?: string
}> {
  const transitions: Array<{
    targetState: AgreementStatus
    action: string
    label: string
    requiresInput: boolean
    confirmationMessage?: string
  }> = []
  
  const actions = getAvailableActions(agreement, user)
  const status = agreement.status
  
  // Map actions to state transitions
  if (status === "draft") {
    if (actions.canSendForSignature) {
      transitions.push({
        targetState: "pending_signature",
        action: "send",
        label: "Send for Signature",
        requiresInput: true // Need to set expiration
      })
    }
    if (actions.canDelete) {
      transitions.push({
        targetState: "draft", // Actually deleted from DB
        action: "delete",
        label: "Delete Draft",
        requiresInput: false,
        confirmationMessage: "Are you sure? This will permanently delete the agreement."
      })
    }
  }
  
  if (status === "pending_signature") {
    if (actions.canWithdrawOffer) {
      transitions.push({
        targetState: "withdrawn",
        action: "withdraw",
        label: "Withdraw Offer",
        requiresInput: true, // Reason optional
        confirmationMessage: "This will cancel the signature request. The agreement can be resent later."
      })
    }
    if (actions.canSign) {
      transitions.push({
        targetState: "active",
        action: "sign",
        label: "Sign Agreement",
        requiresInput: false
      })
    }
    if (actions.canReject) {
      transitions.push({
        targetState: "rejected",
        action: "reject",
        label: "Reject Agreement",
        requiresInput: true, // Reason required
        confirmationMessage: "This will reject the agreement. The creator will be notified."
      })
    }
  }
  
  if (status === "active") {
    if (actions.canRequestAmendment) {
      transitions.push({
        targetState: "pending_amendment",
        action: "request-amendment",
        label: "Request Amendment",
        requiresInput: true // Amendment details required
      })
    }
    if (actions.canRequestCompletion) {
      transitions.push({
        targetState: "pending_completion",
        action: "request-completion",
        label: "Request Completion",
        requiresInput: false
      })
    }
    if (actions.canReportBreach) {
      transitions.push({
        targetState: "breach_reported",
        action: "report-breach",
        label: "Report Breach",
        requiresInput: true, // Breach details required
        confirmationMessage: "This will notify the other party of a breach. Provide details."
      })
    }
    if (actions.canTerminateAgreement) {
      transitions.push({
        targetState: "cancelled",
        action: "terminate",
        label: "Terminate Agreement",
        requiresInput: true, // Reason required
        confirmationMessage: "This will cancel the agreement. This action cannot be undone."
      })
    }
  }
  
  if (status === "pending_amendment") {
    if (actions.canAcceptAmendment) {
      transitions.push({
        targetState: "pending_signature",
        action: "accept-amendment",
        label: "Accept Amendment",
        requiresInput: false
      })
    }
    if (actions.canRejectAmendment) {
      transitions.push({
        targetState: "active",
        action: "reject-amendment",
        label: "Reject Amendment",
        requiresInput: true, // Reason optional
      })
    }
    if (actions.canCancelAmendmentRequest) {
      transitions.push({
        targetState: "active",
        action: "cancel-amendment",
        label: "Cancel Amendment Request",
        requiresInput: false
      })
    }
  }
  
  if (status === "pending_completion") {
    if (actions.canConfirmCompletion) {
      transitions.push({
        targetState: "completed",
        action: "confirm-completion",
        label: "Confirm Completion",
        requiresInput: false
      })
    }
    if (actions.canRejectCompletion) {
      transitions.push({
        targetState: "active",
        action: "reject-completion",
        label: "Reject Completion",
        requiresInput: true, // Reason required
      })
    }
  }
  
  if (status === "breach_reported") {
    if (actions.canWithdrawBreachReport) {
      transitions.push({
        targetState: "active",
        action: "withdraw-breach",
        label: "Withdraw Breach Report",
        requiresInput: false
      })
    }
    if (actions.canAcknowledgeBreach) {
      transitions.push({
        targetState: "pending_completion",
        action: "acknowledge-breach",
        label: "Acknowledge Breach",
        requiresInput: false
      })
    }
    if (actions.canDisputeRejection) {
      transitions.push({
        targetState: "in_dispute",
        action: "dispute-breach",
        label: "Dispute Breach Claim",
        requiresInput: true, // Counter-evidence
      })
    }
    if (actions.canEscalateImmediately || actions.canEscalateToLegal) {
      transitions.push({
        targetState: "legal_resolution",
        action: "escalate-legal",
        label: "Escalate to Legal",
        requiresInput: true,
        confirmationMessage: "This will freeze the agreement and escalate to legal resolution."
      })
    }
  }
  
  if (status === "disputed" || status === "in_dispute") {
    if (actions.canEscalateToLegal) {
      transitions.push({
        targetState: "legal_resolution",
        action: "escalate-legal",
        label: "Escalate to Legal Resolution",
        requiresInput: true,
        confirmationMessage: "Maximum iterations reached. Escalate to legal process?"
      })
    }
    if (actions.canAcceptResolution) {
      transitions.push({
        targetState: "active",
        action: "accept-resolution",
        label: "Accept Resolution",
        requiresInput: false
      })
    }
  }
  
  if (status === "legal_resolution") {
    if (actions.canSubmitCounterProposal) {
      transitions.push({
        targetState: "in_dispute",
        action: "counter-proposal",
        label: "Submit Counter Proposal",
        requiresInput: true
      })
    }
    if (actions.canMarkSettled) {
      transitions.push({
        targetState: "completed",
        action: "mark-settled",
        label: "Mark as Settled",
        requiresInput: true, // Settlement details
        confirmationMessage: "Mark this dispute as settled and complete the agreement?"
      })
    }
    if (actions.canMarkTerminated) {
      transitions.push({
        targetState: "cancelled",
        action: "mark-terminated",
        label: "Mark as Terminated",
        requiresInput: true, // Termination details
        confirmationMessage: "Mark this dispute as terminated and cancel the agreement?"
      })
    }
  }
  
  if (status === "expired") {
    if (actions.canResendExpired) {
      transitions.push({
        targetState: "draft",
        action: "resend-expired",
        label: "Resend as New Agreement",
        requiresInput: true, // New expiration date
      })
    }
  }
  
  return transitions
}

/**
 * Validate if a state transition is allowed
 */
export function canTransitionTo(
  agreement: Agreement,
  user: UserContext,
  targetState: AgreementStatus
): { allowed: boolean; reason?: string } {
  const availableTransitions = getAvailableStateTransitions(agreement, user)
  const transition = availableTransitions.find(t => t.targetState === targetState)
  
  if (!transition) {
    return {
      allowed: false,
      reason: `Cannot transition from ${agreement.status} to ${targetState}`
    }
  }
  
  return { allowed: true }
}
