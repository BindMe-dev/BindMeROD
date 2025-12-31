import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences, legalSignatures } from "@/lib/db/schema"
import { getAgreementById, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

/**
 * POST /api/agreements/[id]/send-for-signature
 * 
 * Creator-only action: Complete the draft and send for counterparty signature
 * This is the "Agreement Completion" (draft done) - NOT legal acceptance
 * 
 * Transition: draft → pending_signature
 */
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

    const agreement = await getAgreementById(agreementId)
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Only creator can send for signature
    if (agreement.userId !== userId) {
      return NextResponse.json({ 
        error: "Only the agreement creator can send for signature" 
      }, { status: 403 })
    }

    // Can only send if in draft or pending_amendment status
    if (!["draft", "pending_amendment"].includes(agreement.status)) {
      return NextResponse.json({
        error: `Cannot send for signature. Agreement status is '${agreement.status}'. Must be 'draft' or 'pending_amendment'.`
      }, { status: 400 })
    }

    // Must have at least one counterparty
    if (!agreement.sharedWith || agreement.sharedWith.length === 0) {
      return NextResponse.json({ 
        error: "Cannot send for signature. Agreement must have at least one counterparty." 
      }, { status: 400 })
    }

    // Update agreement status - creator must sign explicitly
    await db.transaction(async (tx) => {
      const updateData: any = {
        status: "pending_signature",
        sentForSignatureAt: new Date(),
        sentForSignatureBy: userId,
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: userId
      }

      // If coming from pending_amendment, clear rejection fields
      if (agreement.status === "pending_amendment") {
        updateData.rejectionReason = null
        updateData.rejectionType = null
        updateData.rejectedBy = null
        updateData.rejectedAt = null
        updateData.amendmentRequestedChanges = null
      }

      await tx
        .update(agreements)
        .set(updateData)
        .where(eq(agreements.id, agreementId))

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Sent for Signature",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Creator ${user.name || user.email} completed draft and sent agreement for counterparty signature`,
        timestamp: new Date(),
      })
    })

    // Notify all counterparties
    const counterparties = agreement.sharedWith.filter(
      p => (p.role ?? "counterparty") === "counterparty"
    )

    for (const counterparty of counterparties) {
      if (!counterparty.userEmail) continue
      
      // Check notification preferences
      const counterpartyUser = await db.query.users.findFirst({ 
        where: (users, { eq }) => eq(users.email, counterparty.userEmail) 
      })
      
      let allowNotification = true
      if (counterpartyUser) {
        const prefs = await db.query.userPreferences.findFirst({ 
          where: (userPreferences, { eq }) => eq(userPreferences.userId, counterpartyUser.id) 
        })
        allowNotification = (prefs as any)?.agreementNotificationSettings?.sentForSignature ?? true
      }

      if (allowNotification) {
        await sendAgreementEventEmail(counterparty.userEmail, {
          event: "sentForSignature",
          agreementId,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
        })
      }
    }

    // Notify creator for confirmation (if preferences allow)
    const creatorPrefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, userId) })
    const allowCreatorEmail = (creatorPrefs as any)?.agreementNotificationSettings?.sentForSignature ?? true
    if (allowCreatorEmail && user.email) {
      await sendAgreementEventEmail(user.email, {
        event: "sentForSignature",
        agreementId,
        agreementTitle: agreement.title || "Agreement",
        actorName: user.name || user.email,
        actorEmail: user.email,
        details: "Draft completed and sent for counterparty signature.",
      })
    }

    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) throw new Error("Failed to load agreement after update")
    
    triggerAgreementRefresh(agreementId)
    
    return NextResponse.json({ agreement: mapAgreement(updatedAgreement) })
  } catch (error) {
    console.error("Send for signature error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
