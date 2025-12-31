import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const agreementId = params?.id
    
    if (!agreementId) {
      return NextResponse.json({ error: "Agreement ID required" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId)
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    if (agreement.userId !== userId) {
      return NextResponse.json({ 
        error: "Only the creator can respond to amendment requests" 
      }, { status: 403 })
    }

    if (agreement.status !== "pending_amendment") {
      return NextResponse.json({ 
        error: "No pending amendment request" 
      }, { status: 400 })
    }

    const body = await request.json()
    const { action, message } = body

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: "Action must be 'accept' or 'reject'" 
      }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      if (action === 'accept') {
        await tx.update(agreements).set({
          isLocked: false,
        }).where(eq(agreements.id, agreementId))

        await tx.insert(auditLogs).values({
          id: randomUUID(),
          agreementId,
          action: "Amendment Request Accepted",
          performedBy: userId,
          performedByEmail: user.email,
          details: "Creator accepted amendment request and will make changes",
          timestamp: new Date(),
        })
      } else {
        await tx.update(agreements).set({
          status: "cancelled",
          cancelledBy: userId,
          cancelledAt: new Date(),
          cancellationReason: message || "Creator declined amendment request",
        }).where(eq(agreements.id, agreementId))

        await tx.insert(auditLogs).values({
          id: randomUUID(),
          agreementId,
          action: "Amendment Request Declined",
          performedBy: userId,
          performedByEmail: user.email,
          details: message || "Creator declined amendment request and cancelled agreement",
          timestamp: new Date(),
        })
      }
    })

    triggerAgreementRefresh(agreementId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Respond amendment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

