import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { db } from "@/lib/db"
import { agreements, auditLogs, notifications, users, userPreferences } from "@/lib/db/schema"
import { getAgreementForUser } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

type ResolutionType = "accept" | "conditional" | "reject"

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

    const body = await request.json()
    const resolution: ResolutionType = body?.resolution
    const notes: string | undefined = body?.notes

    if (!["accept", "conditional", "reject"].includes(resolution)) {
      return NextResponse.json({ error: "Invalid resolution type" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const agreement = await getAgreementForUser(agreementId, userId, user.email, {
      with: { user: true, sharedWith: true },
    })
    if (!agreement) return NextResponse.json({ error: "Not found or access denied" }, { status: 404 })

    const currentEmailLower = user.email?.toLowerCase() || ""
    const isCreator = agreement.userId === userId
    const isCounterparty =
      agreement.sharedWith?.some((p) => (p.role ?? "counterparty") === "counterparty" && p.userId === userId) ||
      agreement.sharedWith?.some(
        (p) => (p.role ?? "counterparty") === "counterparty" && (p.userEmail || "").toLowerCase() === currentEmailLower,
      )

    if (!isCreator && !isCounterparty) {
      return NextResponse.json({ error: "Not authorized to resolve dispute" }, { status: 403 })
    }

    if (!agreement.disputeReason) {
      return NextResponse.json({ error: "No dispute to resolve" }, { status: 400 })
    }

    // Accept or accept with condition: clear dispute/rejection and return to active
    if (resolution === "accept" || resolution === "conditional") {
      await db.transaction(async (tx) => {
        await tx
          .update(agreements)
          .set({
            status: "active",
            disputeReason: null,
            disputeEvidence: null,
            disputedBy: null,
            disputedAt: null,
            rejectionReason: null,
            rejectionEvidence: null,
            rejectedBy: null,
            rejectedAt: null,
            completedBy: null,
          })
          .where(eq(agreements.id, agreementId))

        await tx.insert(auditLogs).values({
          id: nanoid(),
          agreementId,
          action: "Dispute Resolved",
          performedBy: userId,
          performedByEmail: agreement.user?.email,
          details:
            resolution === "conditional"
              ? `Dispute accepted with conditions${notes ? `: ${notes}` : ""}`
              : `Dispute accepted${notes ? `: ${notes}` : ""}`,
        })
      })

      triggerAgreementRefresh(agreementId)
      // Notify participants who allow disputeRejection emails (resolution)
      const participantEmails = [
        agreement.user?.email,
        ...(agreement.sharedWith?.map((p) => p.userEmail).filter(Boolean) || []),
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
            details: resolution === "conditional" ? `Dispute accepted with conditions${notes ? `: ${notes}` : ""}` : "Dispute accepted",
          })
        }
      }

      return NextResponse.json({ success: true, status: "active" })
    }

    // Reject dispute → legal resolution
    if (agreement.status !== "disputed") {
      return NextResponse.json({ error: "Agreement is not disputed" }, { status: 400 })
    }
    const caseNumber = `LC-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`

    await db.transaction(async (tx) => {
      await tx
        .update(agreements)
        .set({
          status: "legal_resolution",
          legalResolutionTriggered: true,
          legalResolutionTriggeredBy: userId,
          legalResolutionTriggeredAt: new Date(),
          legalCaseNumber: caseNumber,
          legalNotificationsSent: false,
        })
        .where(eq(agreements.id, agreementId))

      await tx.insert(auditLogs).values({
        id: nanoid(),
        agreementId,
        action: "Legal Resolution Triggered",
        performedBy: userId,
        performedByEmail: agreement.user?.email,
        details: `Dispute rejected${notes ? `: ${notes}` : ""}. Case number: ${caseNumber}`,
      })

      const partiesToNotify: Array<{ id: string; email: string | null; name: string | null; role: string }> = []
      if (agreement.user?.id) {
        partiesToNotify.push({
          id: agreement.user.id,
          email: agreement.user.email,
          name: agreement.user.name,
          role: "Creator",
        })
      }
      agreement.sharedWith?.forEach((participant) => {
        if (participant.userId) {
          partiesToNotify.push({
            id: participant.userId,
            email: participant.userEmail || null,
            name: participant.userName || null,
            role: participant.role || "Participant",
          })
        }
      })

      if (partiesToNotify.length) {
        await Promise.all(
          partiesToNotify.map((party) =>
            tx.insert(notifications).values({
              id: nanoid(),
              userId: party.id,
              type: "legal_resolution",
              title: "Legal Resolution Initiated",
              message: `Legal resolution has been triggered for agreement "${agreement.title}". Case number: ${caseNumber}.`,
              agreementId,
            }),
          ),
        )
        await tx
          .update(agreements)
          .set({ legalNotificationsSent: true })
          .where(eq(agreements.id, agreementId))
      }
    })

      triggerAgreementRefresh(agreementId)
      // Notify participants who allow legalResolution emails
      const participantEmails = [
        agreement.user?.email,
        ...(agreement.sharedWith?.map((p) => p.userEmail).filter(Boolean) || []),
      ].filter(Boolean) as string[]
      for (const email of participantEmails) {
        const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
        let allow = true
        if (participantUser) {
          const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
          allow = (prefs as any)?.agreementNotificationSettings?.legalResolution ?? true
        }
        if (allow) {
          await sendAgreementEventEmail(email, {
            event: "legalResolution",
            agreementId,
            agreementTitle: agreement.title || "Agreement",
            actorName: user.name || user.email,
            actorEmail: user.email,
            details: `Legal resolution triggered. Case number: ${caseNumber}`,
          })
        }
      }

      return NextResponse.json({ success: true, status: "legal_resolution", caseNumber })
  } catch (error: any) {
    console.error("[DISPUTE_RESOLVE]", error)
    const message = error?.message || "Failed to resolve dispute"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
