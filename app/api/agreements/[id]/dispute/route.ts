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
    
    if (!reason?.trim()) {
      return NextResponse.json({ error: "Dispute reason is required" }, { status: 400 })
    }

    // Can only dispute if there's a rejection to dispute, or if agreement is active
    const canDispute = 
      (existing.rejectionReason && existing.status === "active") || // Disputing a completion rejection
      (existing.status === "rejected") // Disputing agreement rejection

    if (!canDispute) {
      return NextResponse.json({ 
        error: "Can only dispute rejections. Current status: " + existing.status 
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

    // Store dispute and set status to disputed
    await db.transaction(async (tx) => {
      await tx.update(agreements).set({ 
        status: "disputed",
        disputeReason: reason,
        disputedBy: userId,
        disputedAt: new Date(),
        disputeEvidence: evidenceFiles
      }).where(eq(agreements.id, agreementId))
      
      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Rejection Disputed",
        performedBy: userId,
        performedByEmail: user?.email,
        details: `Rejection disputed: ${reason}`,
      })
    })

    const agreement = await getAgreementById(agreementId)
    if (!agreement) throw new Error("Failed to load agreement after dispute")

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
          details: `Rejection disputed: ${reason}`,
        })
      }
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(agreement) })

  } catch (error: any) {
    console.error("[DISPUTE_REJECTION]", error)
    const message = error?.message || "Failed to dispute rejection"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
