import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, completions, users, userPreferences } from "@/lib/db/schema"
import { getAgreementById, getAgreementForUser, mapAgreement } from "@/lib/server/agreements"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { triggerAgreementRefresh } from "@/lib/realtime"
import { sendAgreementEventEmail } from "@/lib/email-service"

function resolveParams(context: { params: any } | { params: Promise<any> }) {
  if ((context as any)?.params && typeof (context as any).params.then === "function") {
    return (context as any).params
  }
  return (context as any)?.params
}

export async function GET(request: NextRequest, context: { params: any } | { params: Promise<any> }) {
  try {
    const resolved = await resolveParams(context)
    const agreementId = resolved?.id
    if (!agreementId) return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })

    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const agreement = await getAgreementForUser(agreementId, userId, user.email)
    if (!agreement) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ agreement: mapAgreement(agreement) })
  } catch (error) {
    console.error("[AGREEMENT_GET]", error)
    return NextResponse.json({ error: "Failed to fetch agreement" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: any } | { params: Promise<any> }) {
  try {
    const resolved = await resolveParams(context)
    const agreementId = resolved?.id
    if (!agreementId) return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })

    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await getAgreementForUser(agreementId, userId, user.email)
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updates = await request.json()

    // Check if agreement is locked
    if (existing.isLocked && !updates.unlockForAmendment) {
      return NextResponse.json({
        error: "Agreement is locked. Request an amendment from the counterparty to make changes.",
        locked: true,
        amendmentStatus: existing.amendmentStatus
      }, { status: 423 }) // 423 Locked
    }

    const data: Partial<typeof agreements.$inferInsert> = {}

    if (updates.title) data.title = updates.title
    if (updates.description !== undefined) data.description = updates.description ?? null
    if (updates.status) data.status = updates.status
    if (updates.category !== undefined) data.category = updates.category ?? null
    if (updates.tags) data.tags = updates.tags
    if (updates.effectiveDate) data.effectiveDate = updates.effectiveDate
    if (updates.isPermanent !== undefined) {
      data.isPermanent = !!updates.isPermanent
      data.endDate = updates.isPermanent ? null : updates.endDate ?? null
    } else if (updates.endDate !== undefined) {
      data.endDate = updates.endDate ?? null
    }
    if (updates.targetDate !== undefined) data.targetDate = updates.targetDate ?? null
    if (updates.deadline !== undefined) data.deadline = updates.deadline ?? null
    if (updates.recurrenceFrequency !== undefined) data.recurrenceFrequency = updates.recurrenceFrequency ?? null
    if (updates.startDate !== undefined) data.startDate = updates.startDate ?? null
    if (updates.betStake !== undefined) data.betStake = updates.betStake ?? null
    if (updates.betAmount !== undefined) data.betAmount = updates.betAmount ?? null
    if (updates.betOdds !== undefined) data.betOdds = updates.betOdds ?? null
    if (updates.betOpponentName !== undefined) data.betOpponentName = updates.betOpponentName ?? null
    if (updates.betOpponentEmail !== undefined) data.betOpponentEmail = updates.betOpponentEmail ?? null
    if (updates.betSettlementDate !== undefined) data.betSettlementDate = updates.betSettlementDate ?? null
    if (updates.betTerms !== undefined) data.betTerms = updates.betTerms ?? null
    if (updates.notes !== undefined) data.notes = updates.notes ?? null
    if (updates.completedAt !== undefined) data.completedAt = updates.completedAt ? new Date(updates.completedAt) : null
    if (updates.templateId !== undefined) data.templateId = updates.templateId ?? null
    if (updates.templateValues !== undefined) data.templateValues = updates.templateValues

    await db.transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.update(agreements).set(data).where(eq(agreements.id, agreementId))
      }

      if (updates.completions) {
        await tx.delete(completions).where(eq(completions.agreementId, agreementId))
        if (Array.isArray(updates.completions) && updates.completions.length > 0) {
          await tx.insert(completions).values(
            updates.completions.map((c: any) => ({
              id: randomUUID(),
              agreementId,
              date: c.date,
              completed: !!c.completed,
            })),
          )
        }
      }
    })

    const agreement = await getAgreementById(agreementId)
    if (!agreement) return NextResponse.json({ error: "Failed to update agreement" }, { status: 500 })

    // Notify participants who allow update emails
    const participantEmails = [
      agreement.user?.email,
      ...agreement.sharedWith.map((p) => p.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]
    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      let allow = true
      if (participantUser) {
        const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        allow = (prefs as any)?.agreementNotificationSettings?.update ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "update",
          agreementId,
          agreementTitle: agreement.title || "Agreement",
          actorName: user.name || user.email,
          actorEmail: user.email,
          details: "Agreement details were updated.",
        })
      }
    }

    triggerAgreementRefresh(agreementId)
    return NextResponse.json({ agreement: mapAgreement(agreement) })
  } catch (error) {
    console.error("[AGREEMENT_PATCH]", error)
    return NextResponse.json({ error: "Failed to update agreement" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: any } | { params: Promise<any> }) {
  try {
    const resolved = await resolveParams(context)
    const agreementId = resolved?.id
    if (!agreementId) return NextResponse.json({ error: "Agreement id is required" }, { status: 400 })

    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const existing = await db.query.agreements.findFirst({
      where: eq(agreements.id, agreementId),
      with: { legalSignatures: true },
    })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const creatorSigned = existing.legalSignatures?.some((s) => s.role === "creator")
    const counterpartySigned = existing.legalSignatures?.some((s) => s.role === "counterparty")
    if (creatorSigned && counterpartySigned && existing.status !== "completed") {
      return NextResponse.json(
        { error: "Cannot delete a signed agreement before it is completed or voided" },
        { status: 400 },
      )
    }

    await db.delete(agreements).where(eq(agreements.id, agreementId))
    triggerAgreementRefresh(agreementId)

    // Notify participants who allow deletion emails
    const participantEmails = [
      existing.user?.email,
      ...existing.sharedWith.map((p) => p.userEmail).filter(Boolean),
    ].filter(Boolean) as string[]
    for (const email of participantEmails) {
      const participantUser = await db.query.users.findFirst({ where: eq(users.email, email) })
      let allow = true
      if (participantUser) {
        const prefs = await db.query.userPreferences.findFirst({ where: eq(userPreferences.userId, participantUser.id) })
        allow = (prefs as any)?.agreementNotificationSettings?.deletion ?? true
      }
      if (allow) {
        await sendAgreementEventEmail(email, {
          event: "deletion",
          agreementId,
          agreementTitle: existing.title || "Agreement",
          actorName: existing.user?.name || existing.user?.email || "Creator",
          actorEmail: existing.user?.email || "",
          details: "Agreement was deleted by the creator.",
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[AGREEMENT_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete agreement" }, { status: 500 })
  }
}
