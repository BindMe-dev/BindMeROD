import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"

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

    const existing = await getAgreementForUser(agreementId, userId, user.email)
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const { terms } = await request.json()
    if (!terms?.trim()) {
      return NextResponse.json({ error: "Arrangement terms are required" }, { status: 400 })
    }

    // Allow friendly arrangement from disputed status
    if (existing.status !== "disputed") {
      return NextResponse.json({ error: "Can only propose friendly arrangement for disputed agreements" }, { status: 400 })
    }

    // Propose friendly arrangement - allow from disputed status or when no arrangement exists yet
    await db.transaction(async (tx) => {
      await tx.update(agreements).set({ 
        friendlyArrangementProposed: true,
        friendlyArrangementProposedBy: userId,
        friendlyArrangementProposedAt: new Date(),
        friendlyArrangementTerms: terms
      }).where(eq(agreements.id, agreementId))
      
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Friendly Arrangement Proposed",
        performedBy: userId,
        performedByEmail: user?.email,
        details: `Friendly arrangement proposed: ${terms}`,
      })
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("[FRIENDLY_ARRANGEMENT]", error)
    const message = error?.message || "Failed to propose friendly arrangement"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}