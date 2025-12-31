import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { verificationSubmissions, users, admins, adminAuditLogs, notifications } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { sendEmail } from "@/lib/email-service"

async function requireAdmin(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return { ok: false, status: 401 }
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
  if (!admin) return { ok: false, status: 403 }
  return { ok: true, userId }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    const scope = request.nextUrl.searchParams.get("scope")

    // Allow a signed-in user to fetch their own submission without admin rights
    if (scope === "me") {
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      const submission = await db.query.verificationSubmissions.findFirst({
        where: eq(verificationSubmissions.userId, userId),
      })

      return NextResponse.json({ submission })
    }

    const auth = await requireAdmin(request)
    if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

    const rows = await db
      .select({
        id: verificationSubmissions.id,
        userId: verificationSubmissions.userId,
        status: verificationSubmissions.status,
        createdAt: verificationSubmissions.createdAt,
        updatedAt: verificationSubmissions.updatedAt,
        extractedName: verificationSubmissions.extractedName,
        extractedDob: verificationSubmissions.extractedDob,
        verificationType: verificationSubmissions.verificationType,
        reviewerId: verificationSubmissions.reviewerId,
        reviewNotes: verificationSubmissions.reviewNotes,
        rejectionReason: verificationSubmissions.rejectionReason,
        documentUrl: verificationSubmissions.documentUrl,
        selfieUrl: verificationSubmissions.selfieUrl,
        userEmail: users.email,
        userName: users.name,
        userVerified: users.isVerified,
      })
      .from(verificationSubmissions)
      .leftJoin(users, eq(users.id, verificationSubmissions.userId))

    return NextResponse.json({ submissions: rows })
  } catch (error) {
    console.error("[ADMIN_VERIFICATIONS_GET]", error)
    return NextResponse.json({ error: "Failed to load verifications" }, { status: 500 })
  }
}

function buildDecisionEmail(status: string, userName?: string | null) {
  const normalized = status.toLowerCase()
  const heading =
    normalized === "approved"
      ? "Your verification is approved"
      : normalized === "needs_info"
        ? "More information needed"
        : "Your verification was rejected"

  const body =
    normalized === "approved"
      ? "Your identity verification has been approved. You can now sign and share agreements without extra checks."
      : normalized === "needs_info"
        ? "We need a clearer upload or additional details to complete your verification. Please review the notes in the app."
        : "We could not approve your identity verification. Please review the notes in the app and try again."

  return {
    subject: `BindMe verification ${normalized}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; background: #0b1224; color: #e2e8f0; padding: 24px;">
          <div style="max-width: 640px; margin: 0 auto; background: #0f172a; border: 1px solid #1f2937; border-radius: 12px; padding: 24px;">
            <h1 style="margin: 0 0 12px 0; color: #e2e8f0; font-size: 22px;">${heading}</h1>
            <p style="margin: 0 0 12px 0; color: #cbd5e1;">Hi ${userName || "there"},</p>
            <p style="margin: 0 0 12px 0; color: #cbd5e1;">${body}</p>
            <p style="margin: 0; color: #94a3b8;">If this looks wrong, reply to this email and our team will help.</p>
          </div>
        </body>
      </html>
    `,
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const {
      action,
      submissionId,
      status,
      notes,
      rejectionReason,
      intent: _intent,
      documentData,
      selfieData,
      extractedName,
      extractedDob,
      extractedDocNumber,
      verificationType,
    } = body || {}

    const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })

    // Admin action: update status + notify
    if (action && admin) {
      if (!submissionId) return NextResponse.json({ error: "Missing submission id" }, { status: 400 })

      const submission = await db.query.verificationSubmissions.findFirst({
        where: eq(verificationSubmissions.id, submissionId),
      })
      if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 })

      const updates: any = {
        status: status || "processing",
        reviewerId: userId,
        reviewNotes: notes || null,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      }

      await db.update(verificationSubmissions).set(updates).where(eq(verificationSubmissions.id, submissionId))

      const targetUser = await db.query.users.findFirst({ where: eq(users.id, submission.userId) })

      if (status === "approved") {
        await db
          .update(users)
          .set({ isVerified: true, verificationType: "manual_review", verifiedAt: new Date() })
          .where(eq(users.id, submission.userId))
      }
      if (status === "rejected") {
        await db
          .update(users)
          .set({ isVerified: false, verificationType: null, verifiedAt: null })
          .where(eq(users.id, submission.userId))
      }

      await db.insert(adminAuditLogs).values({
        id: randomUUID(),
        adminId: admin.id,
        action: "verification_update",
        targetType: "verification",
        targetId: submissionId,
        details: { status, notes, rejectionReason },
      })

      if (targetUser) {
        await db.insert(notifications).values({
          id: randomUUID(),
          userId: targetUser.id,
          type: "verification_decision",
          priority: "normal",
          category: "update",
          requiresAction: status === "rejected" || status === "needs_info",
          handledAt: null,
          title: status === "approved" ? "Verification approved" : "Verification rejected",
          message:
            status === "approved"
              ? "Your identity verification is approved. You now have full access."
              : status === "needs_info"
                ? notes || rejectionReason || "We need clearer documents or more details to complete verification."
                : rejectionReason || "We could not approve your identity verification. Please re-upload clearer documents.",
        })

        if (targetUser.email) {
          const email = buildDecisionEmail(status || "updated", targetUser.name)
          await sendEmail({ to: targetUser.email, subject: email.subject, html: email.html })
        }
      }

      return NextResponse.json({ ok: true })
    }

    // User submission: upsert to processing
    const existing = await db.query.verificationSubmissions.findFirst({
      where: eq(verificationSubmissions.userId, userId),
    })

    const now = new Date()
    const updatePayload: any = {
      status: "processing",
      updatedAt: now,
      rejectionReason: null,
      reviewNotes: null,
    }
    if (documentData) updatePayload.documentUrl = documentData
    if (selfieData) updatePayload.selfieUrl = selfieData
    if (extractedName) updatePayload.extractedName = extractedName
    if (extractedDob) updatePayload.extractedDob = extractedDob
    if (extractedDocNumber) updatePayload.extractedDocNumber = extractedDocNumber
    if (verificationType) updatePayload.verificationType = verificationType

    if (existing) {
      await db.update(verificationSubmissions).set(updatePayload).where(eq(verificationSubmissions.id, existing.id))
      return NextResponse.json({ ok: true, submissionId: existing.id })
    }

    const [created] = await db
      .insert(verificationSubmissions)
      .values({
        id: randomUUID(),
        userId,
        status: "processing",
        documentUrl: documentData || null,
        selfieUrl: selfieData || null,
        extractedName: extractedName || null,
        extractedDob: extractedDob || null,
        extractedDocNumber: extractedDocNumber || null,
        verificationType: verificationType || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return NextResponse.json({ ok: true, submissionId: created.id })
  } catch (error) {
    console.error("[ADMIN_VERIFICATIONS_POST]", error)
    return NextResponse.json({ error: "Failed to submit verification" }, { status: 500 })
  }
}
