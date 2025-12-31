import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, lawFirmInterventions, lawFirms, lawFirmContacts } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

async function requireAdmin(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return { ok: false, status: 401 }
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
  if (!admin) return { ok: false, status: 403 }
  return { ok: true }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const firmId = searchParams.get("firmId")

  const conditions = []
  if (status) conditions.push(eq(lawFirmInterventions.status, status))
  if (firmId) conditions.push(eq(lawFirmInterventions.firmId, firmId))

  const rows = await db
    .select({
      id: lawFirmInterventions.id,
      firmId: lawFirmInterventions.firmId,
      agreementId: lawFirmInterventions.agreementId,
      triggeredBy: lawFirmInterventions.triggeredBy,
      triggeredAt: lawFirmInterventions.triggeredAt,
      status: lawFirmInterventions.status,
      notes: lawFirmInterventions.notes,
      evidenceLinks: lawFirmInterventions.evidenceLinks,
      assignedContactId: lawFirmInterventions.assignedContactId,
      updatedAt: lawFirmInterventions.updatedAt,
      firmName: lawFirms.name,
      contactName: lawFirmContacts.name,
      contactEmail: lawFirmContacts.email,
    })
    .from(lawFirmInterventions)
    .leftJoin(lawFirms, eq(lawFirms.id, lawFirmInterventions.firmId))
    .leftJoin(lawFirmContacts, eq(lawFirmContacts.id, lawFirmInterventions.assignedContactId))
    .where(conditions.length ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
    .orderBy((table, { desc }) => desc(lawFirmInterventions.triggeredAt))

  return NextResponse.json({ interventions: rows })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { firmId, agreementId, triggeredBy, status, notes, evidenceLinks, assignedContactId } = body || {}
  if (!firmId) return NextResponse.json({ error: "Missing firmId" }, { status: 400 })

  const [created] = await db
    .insert(lawFirmInterventions)
    .values({
      id: randomUUID(),
      firmId,
      agreementId: agreementId || null,
      triggeredBy: triggeredBy || null,
      status: status || "pending",
      notes: notes || null,
      evidenceLinks: evidenceLinks || [],
      assignedContactId: assignedContactId || null,
    })
    .returning()

  return NextResponse.json({ intervention: created })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, status, notes, evidenceLinks, assignedContactId } = body || {}
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 })

  await db
    .update(lawFirmInterventions)
    .set({
      status,
      notes: notes || null,
      evidenceLinks: evidenceLinks || [],
      assignedContactId: assignedContactId || null,
      updatedAt: new Date(),
    })
    .where(eq(lawFirmInterventions.id, id))

  return NextResponse.json({ ok: true })
}
