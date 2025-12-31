import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auditLogs, legalSignatures, users, userPreferences } from "@/lib/db/schema"
import { createNotificationBatch, getAgreementById, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

async function getAgreementForUser(agreementId: string, userId: string, userEmail: string) {
  const agreement = await getAgreementById(agreementId)
  if (!agreement) return null
  
  const userEmailLower = userEmail.toLowerCase()
  const hasAccess = 
    agreement.userId === userId ||
    agreement.sharedWith?.some(p => 
      p.userId === userId || p.userEmail?.toLowerCase() === userEmailLower
    )
  
  return hasAccess ? agreement : null
}

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
      return NextResponse.json({ error: "Agreement ID required" }, { status: 400 })
    }

    const userId = await getUserIdFromRequest()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 })

    const agreement = await getAgreementForUser(agreementId, userId, user.email)
    if (!agreement) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 })
    }

    const body = await request.json()
    const { signatureData, signatureType = "drawn", ipAddress, location } = body

    if (!signatureData) {
      return NextResponse.json({ error: "Signature data required" }, { status: 400 })
    }

    // Comprehensive validation
    const userEmailLower = user.email.toLowerCase()
    const isCreator = agreement.userId === userId
    const isCounterparty = agreement.sharedWith?.some(p => 
      (p.role ?? "counterparty") === "counterparty" && 
      (p.userId === userId || p.userEmail?.toLowerCase() === userEmailLower)
    )
    const isDesignatedWitness = agreement.sharedWith?.some(p => 
      p.role === "witness" && 
      (p.userId === userId || p.userEmail?.toLowerCase() === userEmailLower)
    )

    // Validation checks
    if (isCreator || isCounterparty) {
      return NextResponse.json({ error: "Participants cannot witness their own agreement" }, { status: 403 })
    }
    if (!isDesignatedWitness) {
      return NextResponse.json({ error: "You are not designated as a witness" }, { status: 403 })
    }
    if (agreement.status !== "active") {
      return NextResponse.json({ error: "Agreement must be active to witness" }, { status: 400 })
    }

    // Check if already witnessed
    const existingWitness = agreement.legalSignatures?.find(s => 
      s.role === "witness" && 
      (s.signedBy === userId || s.signedByEmail?.toLowerCase() === userEmailLower)
    )
    if (existingWitness) {
      return NextResponse.json({ error: "You have already witnessed this agreement" }, { status: 400 })
    }

    // Create witness signature
    await db.transaction(async (tx) => {
      await tx.insert(legalSignatures).values({
        id: randomUUID(),
        agreementId,
        signedBy: userId,
        signedByEmail: user.email,
        signedByName: user.name,
        role: "witness",
        signatureData,
        ipAddress,
        userAgent: request.headers.get("user-agent") || "",
        location,
        timestamp: new Date(),
      })

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Agreement Witnessed",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Agreement witnessed by ${user.name} (${signatureType})`,
      })
    })

    const updatedAgreement = await getAgreementById(agreementId)
    if (!updatedAgreement) throw new Error("Failed to load agreement after witnessing")

    // Notify participants who allow witnessSignature emails
    const participantEmails = [
      updatedAgreement.user?.email,
      ...(updatedAgreement.sharedWith?.map((p) => p.userEmail).filter(Boolean) || []),
    ].filter(Boolean) as string[]
    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      let allow = true
      if (participantUser) {
        const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        allow = (prefs as any)?.agreementNotificationSettings?.witnessSignature ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "witnessSignature",
          agreementId,
          agreementTitle: updatedAgreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: "Agreement witnessed by designated witness.",
        })
      }
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(updatedAgreement) })

  } catch (error: any) {
    console.error("[WITNESS_AGREEMENT]", error)
    return NextResponse.json({ error: error.message || "Failed to witness agreement" }, { status: 500 })
  }
}
