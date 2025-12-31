import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users } from "@/lib/db/schema"
import { getAgreementById, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

/**
 * POST /api/agreements/[id]/cancel
 * 
 * Creator-only action: Cancel agreement before counterparty signs
 * 
 * Transition: draft | pending_signature → cancelled
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
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const agreement = await getAgreementById(agreementId)
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Only creator can cancel
    if (agreement.userId !== userId) {
      return NextResponse.json({ 
        error: "Only the agreement creator can cancel" 
      }, { status: 403 })
    }

    // Can only cancel before counterparty signs
    const counterpartySignatures = agreement.legalSignatures?.filter(
      s => s.role === "counterparty"
    ) || []

    if (counterpartySignatures.length > 0) {
      return NextResponse.json({ 
        error: "Cannot cancel after counterparty has signed. Agreement is now legally binding." 
      }, { status: 400 })
    }

    // Can only cancel if in draft or pending_signature status
    if (!["draft", "pending_signature"].includes(agreement.status)) {
      return NextResponse.json({ 
        error: `Cannot cancel. Agreement status is '${agreement.status}'.` 
      }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reason = body.reason || "Cancelled by creator"

    // Update agreement status
    await db.transaction(async (tx) => {
      await tx
        .update(agreements)
        .set({ 
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: reason
        })
        .where(eq(agreements.id, agreementId))

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Agreement Cancelled",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Creator cancelled agreement. Reason: ${reason}`,
        timestamp: new Date(),
      })
    })

    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) throw new Error("Failed to load agreement after update")
    
    triggerAgreementRefresh(agreementId)
    
    return NextResponse.json({ agreement: mapAgreement(updatedAgreement) })
  } catch (error) {
    console.error("Cancel agreement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
