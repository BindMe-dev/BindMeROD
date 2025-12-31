/**
 * Enhanced Agreement Types
 * Supporting complete state machine workflow
 */

export type AgreementStatus =
  // Active/In-Progress States
  | "draft"                    // Creator editing
  | "pending_signature"        // Awaiting counterparty signature
  | "active"                   // Legally binding, both signed
  | "pending_amendment"        // NEW: Proposed changes awaiting approval
  | "pending_completion"       // Awaiting completion confirmation
  | "pending"                  // Legacy alias for pending_completion
  | "breach_reported"          // NEW: Breach under investigation
  | "disputed"                 // Negotiation phase (max 5 iterations)
  | "in_dispute"              // Alias for disputed
  | "legal_resolution"         // NEW: Escalated to legal process
  // Terminal States
  | "completed"                // Successfully fulfilled
  | "rejected"                 // Counterparty rejected
  | "withdrawn"                // NEW: Creator withdrew before signature
  | "cancelled"                // Terminated by creator
  | "expired"                  // NEW: Signature deadline passed
  | "overdue"                  // Past deadline (legacy)

export type SignatureRole = "creator" | "counterparty" | "witness"

export interface LegalSignature {
  id: string
  userId: string
  userEmail: string
  userName: string
  role: SignatureRole
  signedAt: string // ISO timestamp
  ipAddress?: string
  userAgent?: string
  signatureData?: string // Base64 signature image
}

export interface AmendmentProposal {
  id: string
  agreementId: string
  version: number // 1.0, 1.1, 1.2, etc.
  proposedBy: string // userId
  proposedAt: string
  status: "pending" | "accepted" | "rejected" | "cancelled"
  
  // Amendment details
  title: string
  description: string
  changes: AmendmentChange[]
  rationale: string
  urgency: "routine" | "urgent"
  
  // Negotiation thread
  negotiations: NegotiationMessage[]
  iterationCount: number
  
  // Resolution
  reviewedBy?: string // userId
  reviewedAt?: string
  resolution?: "accepted" | "rejected" | "counter-proposed"
  rejectionReason?: string
}

export interface AmendmentChange {
  section: string // Which clause/section
  oldValue: string
  newValue: string
  changeType: "addition" | "deletion" | "modification"
}

export interface NegotiationMessage {
  id: string
  userId: string
  userName: string
  message: string
  timestamp: string
  proposedChanges?: AmendmentChange[]
}

export interface BreachReport {
  id: string
  agreementId: string
  reportedBy: string // userId
  reportedAt: string
  
  // Breach details
  breachType: "payment" | "delivery" | "quality" | "deadline" | "other"
  severity: "minor" | "material" | "fundamental"
  description: string
  evidence: EvidenceItem[]
  
  // Resolution
  status: "reported" | "disputed" | "acknowledged" | "resolved" | "escalated"
  disputeRejectionAttempts: number // Max 2
  curePeriodEndDate?: string
  
  // Other party response
  otherPartyResponse?: {
    userId: string
    responseType: "dispute" | "acknowledge" | "counter-evidence"
    message: string
    timestamp: string
    counterEvidence?: EvidenceItem[]
  }
}

export interface EvidenceItem {
  id: string
  uploadedBy: string
  uploadedAt: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  description: string
  hash?: string // For verification
}

export interface DisputeIteration {
  id: string
  agreementId: string
  iterationNumber: number // 1-5
  proposedBy: string
  proposedAt: string
  
  resolutionProposal: string
  evidence: EvidenceItem[]
  
  response?: {
    userId: string
    responseType: "accept" | "reject" | "counter-propose"
    message: string
    timestamp: string
  }
}

export interface CompletionRequest {
  requestedBy: string // userId
  requestedAt: string
  message?: string
  evidence?: EvidenceItem[]
  
  response?: {
    confirmedBy?: string
    confirmedAt?: string
    rejectedBy?: string
    rejectedAt?: string
    rejectionReason?: string
  }
}

export interface StateTransition {
  id: string
  fromState: AgreementStatus
  toState: AgreementStatus
  triggeredBy: string // userId or "system"
  triggeredAt: string
  reason?: string
  metadata?: Record<string, any>
}

export interface Comment {
  id: string
  userId: string
  userName: string
  userEmail: string
  message: string
  timestamp: string
  attachments?: EvidenceItem[]
  replyTo?: string // Parent comment ID
  resolved?: boolean
  mentions?: string[] // User IDs mentioned with @
}

export interface Agreement {
  // Core identification
  id: string
  title: string
  description: string
  type?: string // "service", "nda", "employment", etc.
  
  // Version tracking
  version: number // 1, 2, 3 for major amendments
  versionString: string // "v1.0", "v1.1", "v2.0"
  parentAgreementId?: string // If this is an amended version
  amendmentHistory: AmendmentProposal[]
  
  // Parties
  creatorId: string
  creatorEmail: string
  creatorName: string
  sharedWith: Array<{
    userId?: string
    email: string
    name?: string
    role: "counterparty" | "witness"
    addedAt: string
  }>
  
  // Status and lifecycle
  status: AgreementStatus
  createdAt: string
  updatedAt: string
  expiresAt?: string // NEW: For PENDING_SIGNATURE expiration
  expirationWarningDays?: number // 7, 3, 1
  
  // Signatures
  legalSignatures?: LegalSignature[]
  legal?: {
    signatures?: LegalSignature[]
  }
  
  // Terms and content
  terms: string // Main agreement text
  milestones?: Array<{
    id: string
    title: string
    description: string
    dueDate?: string
    status: "pending" | "in_progress" | "completed"
    completedAt?: string
  }>
  attachments?: EvidenceItem[]
  
  // Workflow tracking
  completionRequestedBy?: string
  completionRequest?: CompletionRequest
  
  amendmentProposedBy?: string
  currentAmendment?: AmendmentProposal
  
  breachReportedBy?: string
  currentBreach?: BreachReport
  
  disputeHistory?: DisputeIteration[]
  
  // State history
  stateHistory: StateTransition[]
  
  // Communication
  comments?: Comment[]
  
  // Legal resolution
  legalResolution?: {
    caseNumber?: string
    filedAt?: string
    courtDocuments?: EvidenceItem[]
    arbitrator?: string
    mediator?: string
    status: "pending" | "in_progress" | "settled" | "terminated"
    settlementTerms?: string
    settlementDate?: string
  }
  
  // Metadata
  tags?: string[]
  category?: string
  jurisdiction?: string
  relatedAgreements?: string[] // Agreement IDs
  
  // Search and indexing
  searchableText?: string
  lastActivityAt?: string
}

export interface AgreementListItem {
  id: string
  title: string
  status: AgreementStatus
  creatorName: string
  counterpartyNames: string[]
  createdAt: string
  updatedAt: string
  lastActivityAt: string
  version: string
  expiresAt?: string
  requiresAction: boolean // Does current user need to take action?
  actionType?: "sign" | "review_amendment" | "confirm_completion" | "respond_to_dispute"
}

export interface AgreementFilters {
  status?: AgreementStatus[]
  role?: "creator" | "counterparty" | "witness"
  dateRange?: { start: string; end: string }
  search?: string
  requiresAction?: boolean
  tags?: string[]
  category?: string
}

export interface AgreementStats {
  total: number
  byStatus: Record<AgreementStatus, number>
  requiresAction: number
  expiringSoon: number // Within 7 days
  activeDisputes: number
  pendingSignatures: number
}

// Form types for creating/updating agreements

export interface CreateAgreementInput {
  title: string
  description: string
  type?: string
  terms: string
  counterparties: Array<{ email: string; name?: string }>
  witnesses?: Array<{ email: string; name?: string }>
  milestones?: Array<{
    title: string
    description: string
    dueDate?: string
  }>
  expirationDays?: number // Auto-calculate expiresAt
  tags?: string[]
  category?: string
  jurisdiction?: string
}

export interface SendForSignatureInput {
  agreementId: string
  expirationDays?: number // 7, 14, 30, custom, or undefined for no expiration
  customExpirationDate?: string
  message?: string // Optional message to counterparties
  sendReminders?: boolean
  reminderDays?: number[] // [7, 3, 1] days before expiration
}

export interface SignAgreementInput {
  agreementId: string
  signatureData?: string // Base64 signature image (optional)
  ipAddress?: string
  userAgent?: string
}

export interface RequestAmendmentInput {
  agreementId: string
  title: string
  description: string
  changes: AmendmentChange[]
  rationale: string
  urgency: "routine" | "urgent"
}

export interface RespondToAmendmentInput {
  agreementId: string
  amendmentId: string
  response: "accept" | "reject" | "counter-propose"
  message?: string
  counterProposalChanges?: AmendmentChange[]
  rejectionReason?: string
}

export interface ReportBreachInput {
  agreementId: string
  breachType: "payment" | "delivery" | "quality" | "deadline" | "other"
  severity: "minor" | "material" | "fundamental"
  description: string
  evidence: File[]
  curePeriodDays?: number // For minor breaches
}

export interface RespondToBreachInput {
  agreementId: string
  breachId: string
  responseType: "dispute" | "acknowledge" | "counter-evidence"
  message: string
  counterEvidence?: File[]
}

export interface ProposeDisputeResolutionInput {
  agreementId: string
  resolutionProposal: string
  evidence?: File[]
}

export interface RequestCompletionInput {
  agreementId: string
  message?: string
  evidence?: File[]
}

export interface RespondToCompletionInput {
  agreementId: string
  response: "confirm" | "reject"
  rejectionReason?: string
}

export interface WithdrawOfferInput {
  agreementId: string
  reason?: string
}

export interface TerminateAgreementInput {
  agreementId: string
  reason: string
  effectiveDate?: string
  settlementTerms?: string
}

export interface EscalateToLegalInput {
  agreementId: string
  reason: string
  evidence?: File[]
  preferredResolution?: "arbitration" | "mediation" | "litigation"
}

export interface AddCommentInput {
  agreementId: string
  message: string
  attachments?: File[]
  replyTo?: string
  mentions?: string[]
}