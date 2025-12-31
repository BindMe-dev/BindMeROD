import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

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

    if (!existing.rejectionReason) {
      return NextResponse.json({ error: "No rejection to accept" }, { status: 400 })
    }

    const userEmailLower = user.email.toLowerCase()
    const isCreator = existing.userId === userId
    const isCounterparty =
      existing.sharedWith.some((p) => (p.role ?? "counterparty") === "counterparty" && p.userId === userId) ||
      existing.sharedWith.some(
        (p) => (p.role ?? "counterparty") === "counterparty" && (p.userEmail || "").toLowerCase() === userEmailLower,
      )

    // Only the opposite party from the rejector can accept the rejection
    if (existing.rejectedBy === userId) {
      return NextResponse.json({ error: "Another party must accept or dispute the rejection" }, { status: 403 })
    }
    if (!isCreator && !isCounterparty) {
      return NextResponse.json({ error: "Not authorized to accept rejection" }, { status: 403 })
    }

    // Clear rejection and keep agreement active
    await db.transaction(async (tx) => {
      await tx.update(agreements).set({ 
        rejectionReason: null,
        rejectedBy: null,
        rejectedAt: null
      }).where(eq(agreements.id, agreementId))
      
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Rejection Accepted",
        performedBy: userId,
        performedByEmail: user?.email,
        details: "Rejection accepted, agreement remains active",
      })
    })

    const agreement = await getAgreementById(agreementId)
    if (!agreement) throw new Error("Failed to load agreement after accepting rejection")

    // Notify participants who allow disputeRejection emails
    const participantEmails = [
      agreement.user?.email,
      ...agreement.sharedWith.map((p) => p.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]
    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      let allow = true
      if (participantUser) {
        const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        allow = (prefs as any)?.agreementNotificationSettings?.disputeRejection ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "disputeRejection",
          agreementId,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: "Rejection accepted; agreement remains active.",
        })
      }
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(agreement) })

  } catch (error: any) {
    console.error("[ACCEPT_REJECTION]", error)
    const message = error?.message || "Failed to accept rejection"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
