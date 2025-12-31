import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { agreements, legalSignatures, auditLogs, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agreementId } = await params
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Get agreement
    const [agreement] = await db
      .select()
      .from(agreements)
      .where(eq(agreements.id, agreementId))
      .limit(1)

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    // Verify user is the creator
    if (agreement.createdBy !== userId) {
      return NextResponse.json({ error: "Only the creator can sign as creator" }, { status: 403 })
    }

    // Get existing signatures
    const existingSignatures = await db
      .select()
      .from(legalSignatures)
      .where(eq(legalSignatures.agreementId, agreementId))

    // Check if creator already signed
    const creatorAlreadySigned = existingSignatures.some(
      (sig) => sig.role === "creator" && sig.signedBy === userId
    )

    if (creatorAlreadySigned) {
      return NextResponse.json({ error: "Creator has already signed this agreement" }, { status: 400 })
    }

    // Get signature data from request
    const body = await request.json()
    const { signatureData, stamp } = body

    if (!signatureData) {
      return NextResponse.json({ error: "Signature data is required" }, { status: 400 })
    }

    // Add creator signature
    await db.transaction(async (tx) => {
      await tx.insert(legalSignatures).values({
        id: randomUUID(),
        agreementId,
        signedBy: userId,
        signedByEmail: user.email,
        signedByName: user.name || user.email,
        signatureData,
        role: "creator",
        timestamp: new Date(),
        ipAddress: stamp?.ipAddress || "Unknown",
        location: stamp?.location || "Unknown",
        userAgent: request.headers.get("user-agent") || "Unknown",
      })

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Creator Signed",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Creator ${user.name || user.email} signed the agreement`,
        timestamp: new Date(),
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error signing as creator:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign as creator" },
      { status: 500 }
    )
  }
}

