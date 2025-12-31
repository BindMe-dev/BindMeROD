import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

/**
 * POST /api/agreements/[id]/request-amendment
 * 
 * Creator requests permission from counterparty to amend a locked agreement
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const agreementId = params?.id
    if (!agreementId) {
      return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const agreement = await getAgreementById(agreementId)
    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Only creator can request amendments
    if (agreement.userId !== userId) {
      return NextResponse.json({ 
        error: "Only the agreement creator can request amendments" 
      }, { status: 403 })
    }

    // Agreement must be locked
    if (!agreement.isLocked) {
      return NextResponse.json({ 
        error: "Agreement is not locked. You can edit it directly." 
      }, { status: 400 })
    }

    // Check if there's already a pending amendment request
    if (agreement.amendmentStatus === "pending") {
      return NextResponse.json({ 
        error: "There is already a pending amendment request" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { reason, proposedChanges } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json({ 
        error: "Amendment reason is required" 
      }, { status: 400 })
    }

    // Update agreement with amendment request
    await db.transaction(async (tx) => {
      await tx
        .update(agreements)
        .set({
          amendmentRequestedBy: userId,
          amendmentRequestedAt: new Date(),
          amendmentReason: reason,
          amendmentProposedChanges: proposedChanges || null,
          amendmentStatus: "pending",
          amendmentRespondedBy: null,
          amendmentRespondedAt: null,
          amendmentResponse: null,
        })
        .where(eq(agreements.id, agreementId))

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Amendment Requested",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Creator requested permission to amend agreement: ${reason}`,
        timestamp: new Date(),
      })
    })

    // Notify counterparty
    const counterparties = agreement.sharedWith?.filter(
      p => (p.role ?? "counterparty") === "counterparty"
    ) || []

    for (const counterparty of counterparties) {
      const email = counterparty.userEmail
      if (!email) continue

      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, counterparty.userId || ""),
      })

      const allow = prefs?.emailNotifications ?? true
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "amendment_requested",
          agreementId,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: `The creator has requested permission to amend the agreement. Reason: ${reason}`,
        })
      }
    }

    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) throw new Error("Failed to load agreement after update")
    
    triggerAgreementRefresh(agreementId)
    
    return NextResponse.json({ agreement: mapAgreement(updatedAgreement) })
  } catch (error) {
    console.error("Request amendment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

