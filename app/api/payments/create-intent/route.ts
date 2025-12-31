import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, agreements, lawFirmAssignments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { createConsultationPayment } from "@/lib/stripe-service"

/**
 * Create payment intent for consultation
 * POST /api/payments/create-intent
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { agreementId, firmId, amount } = body

    if (!agreementId || !firmId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: agreementId, firmId, amount" },
        { status: 400 }
      )
    }

    // Verify agreement exists and user has access
    const agreement = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
    })

    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      )
    }

    if (agreement.creatorId !== userId && agreement.counterpartyId !== userId) {
      return NextResponse.json(
        { error: "You don't have access to this agreement" },
        { status: 403 }
      )
    }

    // Verify assignment exists
    const assignment = await db.query.lawFirmAssignments.findFirst({
      where: eq(lawFirmAssignments.agreementId, agreementId),
    })

    if (!assignment) {
      return NextResponse.json(
        { error: "No law firm assignment found" },
        { status: 404 }
      )
    }

    // Create payment intent
    const { clientSecret, paymentIntentId } = await createConsultationPayment(
      amount,
      agreementId,
      firmId,
      userId,
      `Legal consultation for: ${agreement.title}`
    )

    // Update assignment with payment intent ID
    await db
      .update(lawFirmAssignments)
      .set({
        paymentIntentId,
        paymentStatus: "pending",
      })
      .where(eq(lawFirmAssignments.id, assignment.id))

    return NextResponse.json({
      clientSecret,
      paymentIntentId,
    })
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    )
  }
}

