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
 * POST /api/agreements/[id]/respond-amendment
 * 
 * Counterparty approves or rejects an amendment request
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

    // Check if user is a counterparty
    const userEmailLower = user.email.toLowerCase()
    const isCounterparty = agreement.sharedWith?.some(
      p => (p.role ?? "counterparty") === "counterparty" && 
           (p.userId === userId || p.userEmail?.toLowerCase() === userEmailLower)
    )

    if (!isCounterparty) {
      return NextResponse.json({ 
        error: "Only counterparties can respond to amendment requests" 
      }, { status: 403 })
    }

    // Check if there's a pending amendment request
    if (agreement.amendmentStatus !== "pending") {
      return NextResponse.json({ 
        error: "No pending amendment request to respond to" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { approved, response } = body

    if (typeof approved !== "boolean") {
      return NextResponse.json({ 
        error: "Approval status (approved: true/false) is required" 
      }, { status: 400 })
    }

    const newStatus = approved ? "approved" : "rejected"
    const action = approved ? "Amendment Approved" : "Amendment Rejected"

    // Update agreement with amendment response
    await db.transaction(async (tx) => {
      const updateData: any = {
        amendmentStatus: newStatus,
        amendmentRespondedBy: userId,
        amendmentRespondedAt: new Date(),
        amendmentResponse: response || null,
      }

      // If approved, unlock the agreement temporarily
      if (approved) {
        updateData.isLocked = false
        updateData.amendmentRequestedBy = null
        updateData.amendmentRequestedAt = null
        updateData.amendmentReason = null
        updateData.amendmentProposedChanges = null
      }

      await tx
        .update(agreements)
        .set(updateData)
        .where(eq(agreements.id, agreementId))

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action,
        performedBy: userId,
        performedByEmail: user.email,
        details: approved 
          ? `Counterparty approved amendment request${response ? `: ${response}` : ""}`
          : `Counterparty rejected amendment request${response ? `: ${response}` : ""}`,
        timestamp: new Date(),
      })
    })

    // Notify creator
    const creator = await db.query.users.findFirst({
      where: eq(users.id, agreement.userId),
    })

    if (creator) {
      const prefs = await db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, creator.id),
      })

      const allow = prefs?.emailNotifications ?? true
      if (allow) {
        await sendAgreementEventEmail(creator.email, {
          event: approved ? "amendment_approved" : "amendment_rejected",
          agreementId,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: approved
            ? `Your amendment request has been approved. You can now edit the agreement.${response ? ` Message: ${response}` : ""}`
            : `Your amendment request has been rejected.${response ? ` Reason: ${response}` : ""}`,
        })
      }
    }

    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) throw new Error("Failed to load agreement after update")
    
    triggerAgreementRefresh(agreementId)
    
    return NextResponse.json({ agreement: mapAgreement(updatedAgreement) })
  } catch (error) {
    console.error("Respond to amendment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

