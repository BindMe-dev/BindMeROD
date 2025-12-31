import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  agreements,
  auditLogs,
  completions,
  legalSignatures,
  participantCompletions,
  sharedParticipants,
  users,
  userPreferences,
} from "@/lib/db/schema"
import { mapAgreement, listAgreementsForUser, getAgreementById } from "@/lib/server/agreements"
import { assertAgreementSchema } from "@/lib/server/schema-audit"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { sendAgreementEventEmail } from "@/lib/email-service"
import { createAgreementSchema } from "@/lib/validation/agreement-schemas"

export { mapAgreement }

// Simplified GET handler
export async function GET(request: NextRequest) {
  console.log("[AGREEMENTS] GET request received")
  
  try {
    // Simple authentication check - same as auth/me API
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      console.log("[AGREEMENTS] No valid session found")
      // Return empty agreements instead of 401 to match frontend expectations
      return NextResponse.json({ 
        agreements: [],
        meta: {
          total: 0,
          timestamp: new Date().toISOString()
        }
      })
    }

    console.log("[AGREEMENTS] Getting user data for:", userId)
    const user = await db.query.users.findFirst({ 
      where: eq(users.id, userId) 
    })
    
    if (!user) {
      console.log("[AGREEMENTS] User not found in database")
      return NextResponse.json({ 
        agreements: [],
        meta: {
          total: 0,
          timestamp: new Date().toISOString()
        }
      })
    }

    console.log("[AGREEMENTS] Getting agreements for user:", user.email)
    // Get agreements with error handling
    const agreementsForUser = await listAgreementsForUser(userId, user.email)
    
    console.log("[AGREEMENTS] Found agreements:", agreementsForUser.length)
    
    return NextResponse.json({ 
      agreements: agreementsForUser.map(mapAgreement),
      meta: {
        total: agreementsForUser.length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("[AGREEMENTS] Error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, { status: 500 })
  }
}

// POST handler temporarily disabled - needs simplification
export async function POST(request: NextRequest) {
  try {
    await assertAgreementSchema()

    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const parsed = createAgreementSchema.safeParse(rawBody)
    if (!parsed.success) {
      const message = parsed.error.errors?.[0]?.message || "Invalid agreement payload"
      return NextResponse.json({ error: message }, { status: 400 })
    }

    // Merge to retain validated fields while keeping extra client fields (e.g. legal metadata)
    const payload: any = { ...rawBody, ...parsed.data }
    const agreementId = randomUUID()
    const today = new Date().toISOString().split("T")[0]

    const sharedWith = Array.isArray(payload.sharedWith) ? payload.sharedWith : []
    const isShared = payload.isShared ?? sharedWith.length > 0

    const agreementRecord: typeof agreements.$inferInsert = {
      id: agreementId,
      userId,
      title: payload.title,
      description: payload.description ?? null,
      purpose: payload.purpose ?? null,
      keyTerms: payload.keyTerms ?? null,
      type: payload.type,
      status: "draft", // Start in draft - creator must explicitly send for signature
      category: payload.category ?? null,
      tags: payload.tags ?? [],
      priority: payload.priority ?? "medium",
      confidentialityLevel: payload.confidentialityLevel ?? "standard",
      isShared,
      isPublic: payload.isPublic ?? false,
      isTemplate: false,
      parentAgreementId: payload.parentAgreementId ?? null,
      version: 1,
      language: payload.language ?? "en",
      currency: payload.currency ?? "GBP",
      timezone: payload.timezone ?? "Europe/London",
      startDate: payload.startDate ?? null,
      deadline: payload.deadline ?? null,
      reminderDays: payload.reminderDays ?? undefined,
      autoRenewal: payload.autoRenewal ?? null,
      renewalPeriod: payload.renewalPeriod ?? null,
      betStake: payload.betStake ?? null,
      betAmount: payload.betAmount ?? null,
      betOdds: payload.betOdds ?? null,
      betOpponentName: payload.betOpponentName ?? null,
      betOpponentEmail: payload.betOpponentEmail?.toLowerCase?.() ?? null,
      betSettlementDate: payload.betSettlementDate ?? null,
      betTerms: payload.betTerms ?? null,
      notes: payload.notes ?? null,
      attachments: payload.attachments ?? undefined,
      metadata: payload.metadata ?? {},
      legalIntentAccepted: payload.legal?.legalIntentAccepted ?? false,
      termsAcceptedVersion: payload.legal?.termsAcceptedVersion ?? "1.0.0",
      jurisdictionClause: payload.legal?.jurisdictionClause ?? "United Kingdom",
      emailConfirmationSent: false,
      witnessRequired: payload.legal?.witnessRequired ?? false,
      witnessStatus: payload.legal?.witnessRequired ? "pending" : null,
      rejectionReason: null,
      disputeReason: null,
      effectiveDate: payload.effectiveDate || today,
      endDate: payload.endDate ?? null,
      isPermanent: payload.isPermanent ?? false,
      targetDate: payload.targetDate ?? null,
      recurrenceFrequency: payload.recurrenceFrequency ?? null,
      templateId: payload.templateId ?? null,
      templateValues: payload.templateValues ?? {},
    }

    const participantRows: typeof sharedParticipants.$inferInsert[] = []
    const participantCompletionsRows: typeof participantCompletions.$inferInsert[] = []

    for (const participant of sharedWith) {
      if (!participant?.userEmail || !participant?.userName) continue
      const participantId = randomUUID()
      participantRows.push({
        id: participantId,
        agreementId,
        role: participant.role ?? "counterparty",
        userId: participant.userId ?? null,
        userName: participant.userName,
        userEmail: participant.userEmail,
        joinedAt: participant.joinedAt ? new Date(participant.joinedAt) : new Date(),
      })

      if (Array.isArray(participant.completions)) {
        participant.completions.forEach((completion: any) => {
          if (!completion?.date) return
          participantCompletionsRows.push({
            id: randomUUID(),
            participantId,
            date: completion.date,
            completed: !!completion.completed,
          })
        })
      }
    }

    const completionRows: typeof completions.$inferInsert[] = Array.isArray(payload.completions)
      ? payload.completions
          .filter((c: any) => c?.date)
          .map((c: any) => ({
            id: randomUUID(),
            agreementId,
            date: c.date,
            completed: !!c.completed,
          }))
      : []

    const signatureInputs: any[] = []
    if (payload.signature) signatureInputs.push(payload.signature)
    if (Array.isArray(payload.signatures)) signatureInputs.push(...payload.signatures)
    if (Array.isArray(payload.legal?.signatures)) signatureInputs.push(...payload.legal.signatures)

    const signatureRows: typeof legalSignatures.$inferInsert[] = signatureInputs
      .filter((sig) => sig?.signedByEmail && sig?.signedByName && sig?.signatureData)
      .map((sig) => ({
        id: randomUUID(),
        agreementId,
        signedBy: sig.signedBy ?? (sig.signedByEmail?.toLowerCase() === user.email.toLowerCase() ? userId : null),
        signedByEmail: sig.signedByEmail,
        signedByName: sig.signedByName,
        signatureData: sig.signatureData,
        role: sig.role ?? "creator",
        timestamp: sig.timestamp ? new Date(sig.timestamp) : new Date(),
        ipAddress: sig.ipAddress ?? "",
        userAgent: sig.userAgent ?? request.headers.get("user-agent") ?? "",
        location: sig.location ?? "",
      }))

    await db.transaction(async (tx) => {
      await tx.insert(agreements).values(agreementRecord)

      if (participantRows.length > 0) {
        await tx.insert(sharedParticipants).values(participantRows)
      }

      if (participantCompletionsRows.length > 0) {
        await tx.insert(participantCompletions).values(participantCompletionsRows)
      }

      if (completionRows.length > 0) {
        await tx.insert(completions).values(completionRows)
      }

      if (signatureRows.length > 0) {
        await tx.insert(legalSignatures).values(signatureRows)
      }

      await tx.insert(auditLogs).values({
        id: randomUUID(),
        agreementId,
        action: "Agreement Created",
        performedBy: userId,
        performedByEmail: user.email,
        details: `Agreement "${payload.title}" created`,
        ipAddress: request.ip ?? undefined,
      })
    })

    const createdAgreement = await getAgreementById(agreementId)
    if (!createdAgreement) {
      throw new Error("Failed to load created agreement")
    }

    // Notify creator and participants on creation
    const participantEmails = [
      user.email,
      ...sharedWith.map((p: any) => p.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]

    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      })
      let allow = true
      if (participantUser) {
        const prefs = await db
          .select({ settings: userPreferences.agreementNotificationSettings })
          .from(userPreferences)
          .where(eq(userPreferences.userId, participantUser.id))
          .limit(1)
        allow = prefs[0]?.settings?.creation ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "creation",
          agreementId,
          agreementTitle: payload.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: "Agreement created and shared with you.",
        })
      }
    }

    triggerAgreementRefresh(agreementId, {
      event: "created",
      actorId: userId,
      actorEmail: user.email,
    })

    return NextResponse.json({ agreement: mapAgreement(createdAgreement) }, { status: 201 })
  } catch (error) {
    console.error("[AGREEMENTS_POST]", error)
    return NextResponse.json({ error: "Failed to create agreement" }, { status: 500 })
  }
}



