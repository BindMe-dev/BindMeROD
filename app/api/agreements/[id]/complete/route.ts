import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"
import { onAgreementCompleted } from "@/lib/viral-helpers"

export async function POST(
  _: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const agreementId = params?.id
    if (!agreementId) {
      return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await getAgreementForUser(agreementId, userId, user.email)
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const userEmailLower = user.email.toLowerCase()
    const isCreator = existing.userId === userId
    const isCounterparty =
      existing.sharedWith.some((p) => (p.role ?? "counterparty") === "counterparty" && p.userId === userId) ||
      existing.sharedWith.some(
        (p) => (p.role ?? "counterparty") === "counterparty" && (p.userEmail || "").toLowerCase() === userEmailLower,
      )

    if (!isCreator && !isCounterparty) {
      return NextResponse.json({ error: "Not authorized to complete" }, { status: 403 })
    }

    // Block completion if in dispute/rejection/legal flow
    if (["disputed", "legal_resolution", "cancelled", "rejected"].includes(existing.status)) {
      return NextResponse.json({ error: "Cannot complete while dispute, rejection, or cancellation is active" }, { status: 400 })
    }

    // Must be in active status to request completion
    if (!["active", "pending_completion", "pending"].includes(existing.status)) {
      return NextResponse.json({ 
        error: `Cannot complete agreement with status '${existing.status}'. Agreement must be active first.` 
      }, { status: 400 })
    }

    // Require counterparty signature before completion
    const counterpartySignatures = existing.legalSignatures?.filter((s) => s.role === "counterparty") || []
    const hasCurrentUserSignature =
      isCreator ||
      counterpartySignatures.some(
        (s) => s.signedBy === userId || s.signedByEmail?.toLowerCase() === userEmailLower
      )
    if (counterpartySignatures.length === 0) {
      return NextResponse.json({ error: "Counterparty must sign before completion" }, { status: 400 })
    }
    if (!hasCurrentUserSignature && isCounterparty) {
      return NextResponse.json({ error: "You must sign before confirming completion" }, { status: 400 })
    }

    if (existing.status === "completed") {
      return NextResponse.json({ agreement: mapAgreement(existing) })
    }

    // Two-step completion: either party can request, the other confirms
    if ((isCreator || isCounterparty) && !["pending_completion", "pending"].includes(existing.status)) {
      await db.transaction(async (tx) => {
        await tx.update(agreements).set({ 
          status: "pending_completion",
          completionRequestedBy: userId,
          completionRequestedAt: new Date(),
          completedBy: userId 
        }).where(eq(agreements.id, agreementId))
        await tx.insert(auditLogs).values({
          id: randomUUID(),
          agreementId,
          action: "Completion Requested",
          performedBy: userId,
          performedByEmail: user?.email,
          details: `Completion requested by ${isCreator ? "creator" : "counterparty"}`,
        })
      })

      // Notify participants who allow completion requests
      const participantEmails = [
        existing.user?.email,
        ...existing.sharedWith.map((s) => s.userEmail).filter(Boolean),
      ].filter(Boolean) as string[]
      for (const email of participantEmails) {
        const participantUser = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.email, email) })
        let allow = true
        if (participantUser) {
          const prefs = await db.query.userPreferences.findFirst({ where: (userPreferences, { eq }) => eq(userPreferences.userId, participantUser.id) })
          allow = (prefs as any)?.agreementNotificationSettings?.requestCompletion ?? true
        }
        if (allow) {
          await sendAgreementEventEmail(email, {
            event: "requestCompletion",
            agreementId,
            agreementTitle: existing.title || "Agreement",
            actorName: user.name || user.email,
            actorEmail: user.email,
          })
        }
      }

      const agreement = await getAgreementById(agreementId)
      if (!agreement) throw new Error("Failed to load agreement after update")
      triggerAgreementRefresh(agreementId)
      return NextResponse.json({ agreement: mapAgreement(agreement) })
    }

    if ((isCreator || isCounterparty) && ["pending_completion", "pending"].includes(existing.status)) {
      // Must be the opposite party confirming (creator → counterparty or vice versa)
      const requester = existing.completionRequestedBy || existing.completedBy
      if (requester === userId) {
        return NextResponse.json({ error: "Awaiting confirmation from the other party" }, { status: 400 })
      }

      await db.transaction(async (tx) => {
        await tx
          .update(agreements)
          .set({ 
            status: "completed", 
            completedAt: new Date(), 
            rejectionReason: null, 
            disputeReason: null 
          })
          .where(eq(agreements.id, agreementId))
        await tx.insert(auditLogs).values({
          id: randomUUID(),
          agreementId,
          action: "Agreement Completed",
          performedBy: userId,
          performedByEmail: user?.email,
          details: `Completion confirmed by ${isCreator ? "creator" : "counterparty"}`,
        })
      })

      // Notify participants who allow completion confirmations
      const participantEmails = [
        existing.user?.email,
        ...existing.sharedWith.map((s) => s.userEmail).filter(Boolean),
      ].filter(Boolean) as string[]
      for (const email of participantEmails) {
        const participantUser = await db.query.users.findFirst({ where: (users, { eq }) => eq(users.email, email) })
        let allow = true
        if (participantUser) {
          const prefs = await db.query.userPreferences.findFirst({ where: (userPreferences, { eq }) => eq(userPreferences.userId, participantUser.id) })
          allow = (prefs as any)?.agreementNotificationSettings?.requestCompletion ?? true
        }
        if (allow) {
          await sendAgreementEventEmail(email, {
            event: "complete",
            agreementId,
            agreementTitle: existing.title || "Agreement",
            actorName: user.name || user.email,
            actorEmail: user.email,
            details: "Completion confirmed",
          })
        }
      }

      const agreement = await getAgreementById(agreementId)
      if (!agreement) throw new Error("Failed to load agreement after completion")

      // Trigger viral features (badges, emails, stats)
      try {
        await onAgreementCompleted(
          userId,
          agreementId,
          existing.type,
          user.email,
          user.name || user.email
        )
      } catch (viralError) {
        console.error("Error triggering viral features:", viralError)
        // Don't fail the completion if viral features fail
      }

      triggerAgreementRefresh(agreementId)
      return NextResponse.json({ agreement: mapAgreement(agreement) })
    }

    return NextResponse.json({ error: "Completion requires one party to request then the other to confirm" }, { status: 400 })

  } catch (error: any) {
    console.error("[COMPLETE_AGREEMENT]", error)
    const message = error?.message || "Failed to complete agreement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
