import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, auditLogs, legalSignatures, users, userPreferences } from "@/lib/db/schema"
import { 
  createNotificationBatch, 
  getAgreementById, 
  mapAgreement 
} from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

export async function POST(
  request: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    // Handle async params for Next.js 15
    const resolvedParams = 
      (context as any)?.params && typeof (context as any).params.then === "function"
        ? await (context as any).params
        : (context as any)?.params

    const agreementId = resolvedParams?.id
    if (!agreementId) {
      return NextResponse.json({ error: "Agreement ID is required" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.signatureData) {
      return NextResponse.json({ error: "Signature is required" }, { status: 400 })
    }

    const user = await db.query.users.findFirst({ 
      where: eq(users.id, userId) 
    })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Get agreement with all relations
    const agreement = await getAgreementById(agreementId)
    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found", agreementId },
        { status: 404 }
      )
    }

    const userEmailLowercase = user.email.toLowerCase()
    
    // Check if user is the creator
    const isCreator = agreement.userId === userId
    
    // Check if user is a shared participant (counterparty)
    const isSharedParticipant = agreement.sharedWith?.some(
      (participant) => 
        participant.userId === userId || 
        participant.userEmail?.toLowerCase() === userEmailLowercase
    )

    if (!isCreator && !isSharedParticipant) {
      return NextResponse.json(
        { 
          error: "Access denied. You must be the creator or a listed counterparty to sign this agreement.",
          agreementId 
        },
        { status: 403 }
      )
    }

    // Check if already signed
    const existingSignature = agreement.legalSignatures?.find(
      (sig) => 
        sig.signedByEmail?.toLowerCase() === userEmailLowercase ||
        (sig.signedBy === userId)
    )

    if (existingSignature) {
      return NextResponse.json(
        { error: "You have already signed this agreement" },
        { status: 400 }
      )
    }

    // Determine role
    const role = isCreator ? "creator" : "counterparty"

    // Check if agreement should transition to active after this signature
    let newStatus = agreement.status
    
    // If counterparty is signing, transition from pending_signature to active
    if (role === "counterparty" && agreement.status === "pending_signature") {
      newStatus = "active"
    }

    // Create signature and audit log in transaction
    await db.transaction(async (tx) => {
      await tx.insert(legalSignatures).values({
        id: randomUUID(),
        agreementId,
        signedBy: userId,
        signedByEmail: user.email,
        signedByName: user.name,
        signatureData: body.signatureData,
        role,
        ipAddress: body.ipAddress || "",
        userAgent: body.userAgent || request.headers.get("user-agent") || "",
        location: body.location || "",
        timestamp: new Date(),
      })

      // Update agreement status if needed
      if (newStatus !== agreement.status) {
        await tx
          .update(agreements)
          .set({ status: newStatus })
          .where(eq(agreements.id, agreementId))
      }

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: newStatus === "active" ? "Agreement Activated" : "Agreement Signed",
        performedBy: userId,
        performedByEmail: user.email,
        details: `${role === "creator" ? "Creator" : "Counterparty"} ${user.name} signed the agreement${newStatus === "active" ? ". Agreement is now legally binding." : ""}`,
        timestamp: new Date(),
      })
    })

    // Wait a moment to ensure transaction is committed
    await new Promise(resolve => setTimeout(resolve, 100))

    // Get updated agreement with fresh data
    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) {
      throw new Error("Failed to retrieve updated agreement")
    }

    // Verify the signature was actually saved
    const signatureExists = updatedAgreement.legalSignatures?.some(
      (sig) => sig.signedBy === userId && sig.role === role
    )
    
    if (!signatureExists) {
      throw new Error("Signature was not properly saved")
    }

    // Create notifications for other participants
    const recipientsMap = new Map<string, { userId: string | null; email: string }>()
    
    // Add shared participants
    ;(updatedAgreement.sharedWith || []).forEach((p: any) => {
      const key = p.userId || p.userEmail?.toLowerCase()
      if (key && !recipientsMap.has(key)) {
        recipientsMap.set(key, { userId: p.userId || null, email: p.userEmail })
      }
    })
    
    // Add creator
    const creatorKey = updatedAgreement.userId || updatedAgreement.user?.email?.toLowerCase()
    if (creatorKey && !recipientsMap.has(creatorKey)) {
      recipientsMap.set(creatorKey, { 
        userId: updatedAgreement.userId, 
        email: updatedAgreement.user?.email || "" 
      })
    }
    
    const recipients = Array.from(recipientsMap.values())

    // Create notifications and emails for all participants (including actor) respecting preferences
    const notificationsData = []
    for (const r of recipients) {
      const emailLower = (r.email || "").toLowerCase()
      const participantUser = emailLower
        ? await db.query.users.findFirst({ where: eq(users.email, emailLower) })
        : null
      const prefs = participantUser
        ? await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        : null
      const allowEmail = participantUser ? (prefs as any)?.agreementNotificationSettings?.counterpartySignature ?? true : true

      if (r.userId) {
        notificationsData.push({
          id: randomUUID(),
          userId: r.userId as string,
          type: "agreement_signature" as const,
          title: `${role === "creator" ? "Creator" : "Counterparty"} signature`,
          message: `${user.name} signed as ${role} on "${updatedAgreement.title}".`,
          agreementId,
        })
      }

      if (allowEmail && r.email) {
        await sendAgreementEventEmail(r.email, {
          event: "counterpartySignature",
          agreementId,
          agreementTitle: updatedAgreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: `${user.name} signed as ${role}.`,
        })
      }
    }

    if (notificationsData.length > 0) {
      await createNotificationBatch(notificationsData)
    }

    // Trigger real-time refresh
    triggerAgreementRefresh(agreementId, {
      event: "signature",
      role,
      actorName: user.name,
      actorEmail: user.email,
      actorId: userId,
      agreementId,
      title: updatedAgreement.title,
      recipients,
    })
    
    return NextResponse.json({ 
      agreement: mapAgreement(updatedAgreement),
      message: "Agreement signed successfully"
    })

  } catch (error) {
    console.error("[AGREEMENT_SIGN]", error)
    const message = error instanceof Error ? error.message : "Failed to sign agreement"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}












































