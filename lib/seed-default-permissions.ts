import { db } from "@/lib/db"
import { actionPermissions } from "@/lib/db/schema"
import { nanoid } from "nanoid"

/**
 * Default action permissions based on current agreement-actions.ts logic
 * This seeds the database with sensible defaults
 */
export async function seedDefaultPermissions() {
  const permissions = []

  // Helper to add permission
  const add = (role: string, status: string, action: string, enabled: boolean) => {
    permissions.push({
      id: nanoid(),
      role,
      status,
      action,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // DRAFT - Creator permissions
  add("creator", "draft", "canEdit", true)
  add("creator", "draft", "canSendForSignature", true)
  add("creator", "draft", "canSetExpiration", true)
  add("creator", "draft", "canCancelDraft", true)
  add("creator", "draft", "canDelete", true)
  add("creator", "draft", "canDuplicate", true)

  // PENDING_SIGNATURE - Creator permissions
  add("creator", "pending_signature", "canWithdrawOffer", true)
  add("creator", "pending_signature", "canCancel", true)
  add("creator", "pending_signature", "canResend", true)
  add("creator", "pending_signature", "canDelete", true)
  add("creator", "pending_signature", "canDuplicate", true)

  // PENDING_SIGNATURE - Counterparty permissions
  add("counterparty", "pending_signature", "canSign", true)
  add("counterparty", "pending_signature", "canReject", true)

  // ACTIVE - Creator permissions
  add("creator", "active", "canRequestCompletion", true)
  add("creator", "active", "canRequestAmendment", true)
  add("creator", "active", "canTerminateAgreement", true)
  add("creator", "active", "canReportBreach", true)
  add("creator", "active", "canDownloadReceipt", true)
  add("creator", "active", "canExportPDF", true)
  add("creator", "active", "canDuplicate", true)

  // ACTIVE - Counterparty permissions
  add("counterparty", "active", "canRequestCompletion", true)
  add("counterparty", "active", "canRequestAmendment", true)
  add("counterparty", "active", "canReportBreach", true)
  add("counterparty", "active", "canDownloadReceipt", true)
  add("counterparty", "active", "canExportPDF", true)

  // PENDING_COMPLETION - Both roles
  add("creator", "pending_completion", "canConfirmCompletion", true)
  add("creator", "pending_completion", "canRejectCompletion", true)
  add("counterparty", "pending_completion", "canConfirmCompletion", true)
  add("counterparty", "pending_completion", "canRejectCompletion", true)

  // COMPLETED - Both roles
  add("creator", "completed", "canDuplicate", true)
  add("creator", "completed", "canDownloadReceipt", true)
  add("creator", "completed", "canExportPDF", true)
  add("counterparty", "completed", "canDownloadReceipt", true)
  add("counterparty", "completed", "canExportPDF", true)

  // CANCELLED - Creator permissions
  add("creator", "cancelled", "canDuplicate", true)
  add("creator", "cancelled", "canDelete", true)

  // EXPIRED - Creator permissions
  add("creator", "expired", "canResendExpired", true)
  add("creator", "expired", "canDuplicate", true)
  add("creator", "expired", "canDelete", true)

  // REJECTED - Creator permissions
  add("creator", "rejected", "canDuplicate", true)

  // PENDING_AMENDMENT - Both roles
  add("creator", "pending_amendment", "canAcceptAmendment", true)
  add("creator", "pending_amendment", "canRejectAmendment", true)
  add("creator", "pending_amendment", "canDiscussAmendment", true)
  add("counterparty", "pending_amendment", "canAcceptAmendment", true)
  add("counterparty", "pending_amendment", "canRejectAmendment", true)
  add("counterparty", "pending_amendment", "canCounterProposeAmendment", true)
  add("counterparty", "pending_amendment", "canDiscussAmendment", true)

  // BREACH_REPORTED - Both roles
  add("creator", "breach_reported", "canProvideEvidence", true)
  add("creator", "breach_reported", "canProvideCounterEvidence", true)
  add("creator", "breach_reported", "canAcknowledgeBreach", true)
  add("creator", "breach_reported", "canEscalateToLegal", true)
  add("counterparty", "breach_reported", "canProvideEvidence", true)
  add("counterparty", "breach_reported", "canProvideCounterEvidence", true)
  add("counterparty", "breach_reported", "canDisputeRejection", true)

  // DISPUTED - Both roles
  add("creator", "disputed", "canProposeResolution", true)
  add("creator", "disputed", "canAcceptResolution", true)
  add("creator", "disputed", "canEscalateToLegal", true)
  add("counterparty", "disputed", "canProposeResolution", true)
  add("counterparty", "disputed", "canAcceptResolution", true)
  add("counterparty", "disputed", "canRequestMediation", true)

  // LEGAL_RESOLUTION - Both roles
  add("creator", "legal_resolution", "canSubmitCounterProposal", true)
  add("creator", "legal_resolution", "canUploadLegalDocuments", true)
  add("counterparty", "legal_resolution", "canSubmitCounterProposal", true)
  add("counterparty", "legal_resolution", "canUploadLegalDocuments", true)

  // Universal actions for all statuses
  const allStatuses = [
    "draft", "pending_signature", "active", "pending_amendment", 
    "pending_completion", "breach_reported", "disputed", "legal_resolution",
    "completed", "rejected", "withdrawn", "cancelled", "expired", "overdue"
  ]

  for (const status of allStatuses) {
    add("creator", status, "canViewAudit", true)
    add("creator", status, "canAddComments", true)
    add("creator", status, "canViewHistory", true)
    add("counterparty", status, "canAddComments", true)
    add("counterparty", status, "canViewHistory", true)
  }

  // Insert all permissions
  if (permissions.length > 0) {
    await db.insert(actionPermissions).values(permissions)
  }

  console.log(`✓ Seeded ${permissions.length} default action permissions`)
}

