import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences } from "@/lib/db/schema"
import { getAgreementForUser, mapAgreement, getAgreementById } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const agreementId = params?.id
    if (!agreementId) return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const agreement = await getAgreementForUser(agreementId, userId, user.email, {
      with: { legalSignatures: true },
    })
    if (!agreement || agreement.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only allow withdrawal if no signatures exist
    const hasAnySignatures = (agreement.legalSignatures || []).length > 0
    if (hasAnySignatures) {
      return NextResponse.json({ error: "Cannot withdraw an agreement that has been signed" }, { status: 400 })
    }

    // Block withdrawal for terminal/legal states
    if (["completed", "disputed", "legal_resolution"].includes(agreement.status)) {
      return NextResponse.json({ error: "Cannot withdraw in the current state" }, { status: 400 })
    }

    await db.transaction(async (tx) => {
      await tx.update(agreements).set({ status: "withdrawn" }).where(eq(agreements.id, agreementId))
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Agreement Withdrawn",
        performedBy: userId,
        performedByEmail: user.email,
        details: "Creator withdrew the agreement before any signatures",
      })
    })

    const updated = await getAgreementById(agreementId)
    // Notify participants who allow withdrawal emails
    const participantEmails = [
      agreement.user?.email,
      ...agreement.sharedWith.map((s) => s.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]
    const prefs = await db
      .select({ userId: userPreferences.userId, settings: userPreferences.agreementNotificationSettings })
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
    const allowEmail = prefs[0]?.settings?.withdrawal ?? true
    if (allowEmail) {
      await Promise.all(
        participantEmails.map((email) =>
          sendAgreementEventEmail(email, {
            event: "withdrawal",
            agreementId,
            agreementTitle: agreement.title || "Agreement",
            actorName: user.name || user.email,
            actorEmail: user.email,
            details: "Agreement withdrawn by creator before any signatures.",
          }),
        ),
      )
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(updated) })
  } catch (error) {
    console.error("[AGREEMENT_WITHDRAW]", error)
    return NextResponse.json({ error: "Failed to withdraw agreement" }, { status: 500 })
  }
}
