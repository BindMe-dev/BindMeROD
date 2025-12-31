import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, users, userPreferences } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

const buildClientFingerprint = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || ""
  const ipAddress = forwarded.split(",")[0].trim() || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"
  const platform = request.headers.get("sec-ch-ua-platform") || "unknown"
  const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop"
  return {
    ipAddress,
    userAgent,
    platform,
    deviceType,
    capturedAt: new Date().toISOString(),
  }
}

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

    const formData = await request.formData()
    const reason = formData.get('reason') as string
    const rejectionType = formData.get('rejectionType') as string
    const requestedChanges = formData.get('requestedChanges') as string

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const userEmailLower = user.email.toLowerCase()
    const isCreator = existing.userId === userId
    const isCounterparty =
      existing.sharedWith.some((p) => (p.role ?? "counterparty") === "counterparty" && p.userId === userId) ||
      existing.sharedWith.some(
        (p) => (p.role ?? "counterparty") === "counterparty" && (p.userEmail || "").toLowerCase() === userEmailLower,
      )

    if (!isCreator && !isCounterparty) {
      return NextResponse.json({ error: "Not authorized to reject" }, { status: 403 })
    }

    // Counterparty can reject if status is pending_signature (before signing)
    // Either party can reject completion request if status is pending_completion
    const canReject = 
      (isCounterparty && existing.status === "pending_signature") ||
      (existing.status === "pending_completion" || existing.status === "pending")

    if (!canReject) {
      return NextResponse.json({ 
        error: `Cannot reject. Current status: ${existing.status}` 
      }, { status: 400 })
    }

    // Process evidence files with client fingerprint
    const clientFingerprint = buildClientFingerprint(request)
    const evidenceFiles: any[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('evidence_') && value instanceof File) {
        // Create a data URL for the file
        const buffer = await value.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const dataUrl = `data:${value.type};base64,${base64}`
        
        evidenceFiles.push({
          name: value.name,
          type: value.type,
          url: dataUrl,
          ...clientFingerprint,
        })
      }
    }

    // Validate rejection type for pre-signature rejections
    if (existing.status === "pending_signature") {
      if (!rejectionType || !['hard', 'soft'].includes(rejectionType)) {
        return NextResponse.json({
          error: "Rejection type must be 'hard' or 'soft'"
        }, { status: 400 })
      }

      if (rejectionType === 'soft' && !requestedChanges?.trim()) {
        return NextResponse.json({
          error: "Requested changes are required for soft rejection"
        }, { status: 400 })
      }
    }

    // Determine new status based on context
    let newStatus = "rejected"
    let auditAction = "Agreement Rejected"
    let auditDetails = `${isCounterparty ? "Counterparty" : "Creator"} rejected. Reason: ${reason}`

    if (existing.status === "pending_signature" && rejectionType === "soft") {
      newStatus = "pending_amendment"
      auditAction = "Amendment Requested"
      auditDetails = `${isCounterparty ? "Counterparty" : "Creator"} requested changes: ${requestedChanges}`
    } else if (existing.status === "pending_completion" || existing.status === "pending") {
      // Rejecting a completion request - go back to active
      newStatus = "active"
      auditAction = "Completion Request Rejected"
      auditDetails = `${isCounterparty ? "Counterparty" : "Creator"} rejected completion. Reason: ${reason}`
    }

    // Update agreement
    await db.transaction(async (tx) => {
      await tx.update(agreements).set({
        status: newStatus,
        rejectionReason: reason,
        rejectionType: rejectionType || null,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionEvidence: evidenceFiles,
        amendmentRequestedChanges: rejectionType === 'soft' ? requestedChanges : null,
        completedBy: null // Clear any completion request
      }).where(eq(agreements.id, agreementId))
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: auditAction,
        performedBy: userId,
        performedByEmail: user.email,
        details: auditDetails,
        timestamp: new Date(),
      })
    })

    // Notify participants who allow rejectCompletion emails
    const participantEmails = [
      existing.user?.email,
      ...existing.sharedWith.map((p) => p.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]
    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      let allow = true
      if (participantUser) {
        const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        allow = (prefs as any)?.agreementNotificationSettings?.rejectCompletion ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "rejectCompletion",
          agreementId,
          agreementTitle: existing.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: `Completion rejected: ${reason}`,
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("[REJECT_COMPLETION]", error)
    const message = error?.message || "Failed to reject completion"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
