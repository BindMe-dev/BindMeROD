import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { withErrorHandler } from "@/lib/api/error-handler"
import { requireAuth } from "@/lib/security/middleware"
import { 
  getWorkflowContext, 
  assertBothSigned, 
  assertNotSelfAction 
} from "@/lib/server/workflow"
import { ValidationError } from "@/lib/api/error-handler"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

const MAX_ITERATIONS = 5

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const userId = await requireAuth(request)
  const { id: agreementId } = await params
  const body = await request.json()
  const { action, reason, evidence, terms } = body

  const ctx = await getWorkflowContext(agreementId, userId)
  const { agreement, isCreator, isCounterparty } = ctx

  let updates: any = { updatedAt: new Date() }
  let eventType: string = ""
  let eventDetails: string = ""

  switch (action) {
    case "REQUEST_COMPLETION":
      if (agreement.status !== "active") {
        throw new ValidationError("Agreement must be active to request completion")
      }
      assertBothSigned(ctx)
      updates = {
        ...updates,
        status: "pending_completion",
        completionRequestedBy: userId,
        completionRequestedAt: new Date(),
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionEvidence: null
      }
      eventType = "requestCompletion"
      eventDetails = "Completion has been requested."
      break;

    case "CONFIRM_COMPLETION":
      if (agreement.status !== "pending_completion") {
        throw new ValidationError("Agreement must be pending completion to confirm")
      }
      assertNotSelfAction(userId, agreement.completionRequestedBy, "confirm")
      updates = {
        ...updates,
        status: "completed",
        completedBy: userId,
        completedAt: new Date(),
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        disputeReason: null,
        disputedBy: null,
        disputedAt: null,
        disputePhase: null
      }
      eventType = "complete"
      eventDetails = "Agreement has been marked as completed."
      break;

    case "REJECT_COMPLETION":
      if (agreement.status !== "pending_completion") {
        throw new ValidationError("Agreement must be pending completion to reject")
      }
      // Anyone participant can reject if it's pending completion (usually the one who didn't request it, but rules say Creator OR Counterparty)
      // Actually, rule 2 says "Actor != completionRequestedBy" for CONFIRM. 
      // Rule 3 says "Who: Creator OR Counterparty" for REJECT. 
      // I should probably also prevent self-rejection if they requested it? 
      // "A party cannot confirm, accept, or dispute its own action."
      assertNotSelfAction(userId, agreement.completionRequestedBy, "reject")
      
      updates = {
        ...updates,
        status: "active",
        rejectedBy: userId,
        rejectionReason: reason || "No reason provided",
        rejectionEvidence: evidence || null,
        rejectedAt: new Date(),
        completionRequestedBy: null,
        completedBy: null
      }
      eventType = "rejectCompletion"
      eventDetails = `Completion request was rejected. Reason: ${reason}`
      break;

    case "DISPUTE_REJECTION":
      if (agreement.status !== "active" || !agreement.rejectedBy) {
        throw new ValidationError("No rejection exists to dispute")
      }
      assertNotSelfAction(userId, agreement.rejectedBy, "dispute")
      updates = {
        ...updates,
        status: "disputed",
        disputePhase: "open",
        disputedBy: userId,
        disputeReason: reason || "No reason provided",
        disputeEvidence: evidence || null,
        disputedAt: new Date(),
        iterationNumber: 0
      }
      eventType = "disputeRejection"
      eventDetails = `The rejection has been disputed. Reason: ${reason}`
      break;

    case "ACCEPT_REJECTION":
      if (agreement.status !== "active" || !agreement.rejectedBy) {
        throw new ValidationError("No rejection exists to accept")
      }
      assertNotSelfAction(userId, agreement.rejectedBy, "accept")
      updates = {
        ...updates,
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null,
        rejectionEvidence: null
        // status remains active
      }
      eventType = "update"
      eventDetails = "Rejection was accepted. Agreement remains active."
      break;

    case "PROPOSE_RESOLUTION":
      if (agreement.status !== "disputed") {
        throw new ValidationError("Agreement must be in dispute to propose resolution")
      }
      if (agreement.iterationNumber! >= MAX_ITERATIONS) {
        throw new ValidationError("Maximum negotiation iterations reached")
      }
      // Actor cannot be the last proposer
      if (agreement.proposalBy === userId || agreement.counterProposalBy === userId) {
         // But they can if it's the first proposal or they are responding to a counter
         if (agreement.disputePhase === 'conditional_offer' && agreement.proposalBy === userId) {
            throw new ValidationError("Wait for a response to your proposal")
         }
         if (agreement.disputePhase === 'counter_offer' && agreement.counterProposalBy === userId) {
            throw new ValidationError("Wait for a response to your counter-proposal")
         }
      }

      if (agreement.disputePhase === 'counter_offer') {
          // Responding to counter
          updates = {
            ...updates,
            disputePhase: "conditional_offer",
            iterationNumber: (agreement.iterationNumber || 0) + 1,
            proposalBy: userId,
            proposalTerms: terms,
            proposalEvidence: evidence || null,
            proposalAt: new Date(),
            // Clear prior counter
            counterProposalBy: null,
            counterProposalTerms: null,
            counterProposalAt: null
          }
      } else {
          // Initial or following a rejection of conditions? 
          // Rule 6: Allowed when status == disputed, No active proposal OR actor responding to counter
          updates = {
            ...updates,
            disputePhase: agreement.disputePhase === 'open' ? "conditional_offer" : "conditional_offer",
            iterationNumber: (agreement.iterationNumber || 0) + 1,
            proposalBy: userId,
            proposalTerms: terms,
            proposalEvidence: evidence || null,
            proposalAt: new Date()
          }
      }
      eventType = "update"
      eventDetails = "A resolution proposal has been made."
      break;

    case "RESPOND_PROPOSAL":
      if (agreement.status !== "disputed") {
        throw new ValidationError("Agreement must be in dispute to respond")
      }
      const isRespondingToProposal = agreement.disputePhase === 'conditional_offer' && userId !== agreement.proposalBy
      const isRespondingToCounter = agreement.disputePhase === 'counter_offer' && userId !== agreement.counterProposalBy
      
      if (!isRespondingToProposal && !isRespondingToCounter) {
          throw new ValidationError("It is not your turn to respond or no active proposal exists")
      }

      if (body.subAction === "ACCEPT") {
          updates = {
            ...updates,
            status: "active",
            disputePhase: "resolved",
            resolutionType: "conditional_acceptance",
            resolvedAt: new Date(),
            // Clear dispute/rejection fields
            rejectionReason: null,
            rejectedBy: null,
            rejectedAt: null,
            rejectionEvidence: null,
            disputeReason: null,
            disputedBy: null,
            disputedAt: null,
            disputeEvidence: null,
            proposalBy: null,
            proposalTerms: null,
            proposalAt: null,
            counterProposalBy: null,
            counterProposalTerms: null,
            counterProposalAt: null
          }
          eventDetails = "Resolution proposal was accepted. Agreement is back to active."
      } else if (body.subAction === "REJECT_DEADLOCK") {
          updates = {
            ...updates,
            disputePhase: "deadlock",
            refusalBy: userId,
            refusalReason: reason || "Negotiation failed",
            refusalAt: new Date()
          }
          eventDetails = "Resolution proposal was rejected without counter. Dispute is now in deadlock."
      } else if (body.subAction === "COUNTER") {
          if (agreement.iterationNumber! >= MAX_ITERATIONS) {
            throw new ValidationError("Maximum negotiation iterations reached. Cannot counter-propose.")
          }
          updates = {
            ...updates,
            disputePhase: "counter_offer",
            iterationNumber: (agreement.iterationNumber || 0) + 1,
            counterProposalBy: userId,
            counterProposalTerms: terms,
            counterProposalAt: new Date()
          }
          eventDetails = "A counter-proposal has been made."
      }
      eventType = "update"
      break;

    case "ESCALATE_LEGAL":
      if (agreement.status !== "disputed") {
        throw new ValidationError("Agreement must be in dispute to escalate")
      }
      updates = {
        ...updates,
        status: "legal_resolution",
        legalResolutionTriggered: true,
        legalResolutionTriggeredBy: userId,
        legalResolutionTriggeredAt: new Date(),
        legalCaseNumber: `LC-${agreementId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`
      }
      eventType = "legalResolution"
      eventDetails = "Agreement has been escalated to legal resolution and is now frozen."
      break;

    default:
      throw new ValidationError(`Unknown action: ${action}`)
  }

  await db.update(agreements).set(updates).where(eq(agreements.id, agreementId))

  // Trigger real-time refresh
  triggerAgreementRefresh(agreementId, { action, actorId: userId })

  // Send notifications
  const participantEmails = [
    agreement.user?.email,
    ...agreement.sharedWith.map((p) => p.userEmail).filter(Boolean),
  ].filter(Boolean) as string[]

  for (const email of participantEmails) {
    const targetEmail = email;
    const participantUser = await db.query.users.findFirst({ where: eq(users.email, targetEmail.toLowerCase()) })
    let allow = true
    if (participantUser) {
      const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
      const settings = (prefs as any)?.agreementNotificationSettings || {}
      
      // Map eventType to settings keys
      const settingKey = (eventType as string)
      allow = settings[settingKey] ?? true
    }

    if (allow) {
      await sendAgreementEventEmail(targetEmail, {
        event: eventType as any || "update",
        agreementId,
        agreementTitle: agreement.title,
        actorName: ctx.user.name,
        actorEmail: ctx.user.email,
        details: eventDetails,
      })
    }
  }

  return NextResponse.json({ success: true, status: updates.status || agreement.status })
})
