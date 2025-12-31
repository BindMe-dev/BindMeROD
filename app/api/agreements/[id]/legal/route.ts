import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, notifications, users, userPreferences } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { getAgreementForUser } from "@/lib/server/agreements"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    // Only allow creator or counterparties to trigger legal resolution
    const agreement = await getAgreementForUser(id, userId, user.email, {
      with: {
        user: true,
        sharedWith: true,
        legalSignatures: true,
      },
    })

    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found or access denied" }, { status: 404 })
    }

    // Can only trigger legal resolution from disputed status or active status with rejection/dispute
    const canTriggerLegal = 
      agreement.status === "disputed" ||
      (agreement.status === "active" && (agreement.rejectionReason || agreement.disputeReason))

    if (!canTriggerLegal) {
      return NextResponse.json({ 
        error: `Cannot trigger legal resolution. Status: ${agreement.status}. Must be disputed or have active rejection.` 
      }, { status: 400 })
    }

    // Prevent duplicate triggers
    if (agreement.status === "legal_resolution" || agreement.status === "completed") {
      return NextResponse.json({ error: "Legal resolution already triggered or agreement completed" }, { status: 400 })
    }

    // Generate unique case number
    const caseNumber = `LC-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`

    // Update agreement status to legal resolution
    await db.update(agreements)
      .set({
        status: "legal_resolution",
        legalResolutionTriggered: true,
        legalResolutionTriggeredBy: userId,
        legalResolutionTriggeredAt: new Date(),
        legalCaseNumber: caseNumber,
        legalNotificationsSent: false,
      })
      .where(eq(agreements.id, id))

    // Create audit log
    await db.insert(auditLogs).values({
      id: nanoid(),
      agreementId: id,
      action: "Legal Resolution Triggered",
      performedBy: userId,
      performedByEmail: user.email,
      details: `Legal resolution initiated. Case number: ${caseNumber}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    })

    // Collect all parties to notify
    const partiesToNotify = [
      { id: agreement.user.id, email: agreement.user.email, name: agreement.user.name, role: "Creator" }
    ]

    // Add counterparties
    agreement.sharedWith?.forEach(participant => {
      if (participant.role === "counterparty" && participant.userId) {
        partiesToNotify.push({
          id: participant.userId,
          email: participant.userEmail,
          name: participant.userName,
          role: "Counterparty"
        })
      }
    })

    // Add witnesses
    agreement.sharedWith?.forEach(participant => {
      if (participant.role === "witness" && participant.userId) {
        partiesToNotify.push({
          id: participant.userId,
          email: participant.userEmail,
          name: participant.userName,
          role: "Witness"
        })
      }
    })

    // Send notifications to all parties
    const notificationPromises = partiesToNotify.map(party => 
      db.insert(notifications).values({
        id: nanoid(),
        userId: party.id,
        type: "legal_resolution",
        title: "Legal Resolution Initiated",
        message: `Legal resolution has been triggered for agreement "${agreement.title}". Case number: ${caseNumber}. You may be contacted by legal representatives.`,
        agreementId: id,
      })
    )

    await Promise.all(notificationPromises)

    // Mark notifications as sent
    await db.update(agreements)
      .set({ legalNotificationsSent: true })
      .where(eq(agreements.id, id))

    // Email participants who allow legalResolution emails
    const participantEmails = partiesToNotify.map((p) => p.email).filter(Boolean) as string[]
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
          agreementId: id,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: `Legal resolution initiated. Case number: ${caseNumber}`,
        })
      }
    }

    triggerAgreementRefresh(id)

    return NextResponse.json({ 
      success: true, 
      caseNumber,
      notifiedParties: partiesToNotify.length
    })

  } catch (error) {
    console.error("Legal resolution trigger failed:", error)
    return NextResponse.json(
      { error: "Failed to trigger legal resolution" },
      { status: 500 }
    )
  }
}
