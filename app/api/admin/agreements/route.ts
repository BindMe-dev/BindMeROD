import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, agreements, lawFirmAssignments, sharedParticipants, users } from "@/lib/db/schema"
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
  const firmId = searchParams.get("firmId")
  const onlyActive = searchParams.get("active")

  // If no firmId provided, return a lightweight list of agreements for selection
  if (!firmId) {
    const rows = await db
      .select({
        id: agreements.id,
        title: agreements.title,
        status: agreements.status,
        createdAt: agreements.createdAt,
        creatorEmail: users.email,
        counterpartyEmail: sharedParticipants.userEmail,
      })
      .from(agreements)
      .leftJoin(users, eq(users.id, agreements.userId))
      .leftJoin(sharedParticipants, eq(sharedParticipants.agreementId, agreements.id))
      .orderBy((table, { desc }) => desc(agreements.createdAt))
      .limit(200)

    return NextResponse.json({
      agreements: rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        createdAt: row.createdAt,
        creatorEmail: row.creatorEmail,
        counterpartyEmail: row.counterpartyEmail,
      })),
    })
  }

  const conditions = []
  if (firmId) conditions.push(eq(lawFirmAssignments.firmId, firmId))
  if (onlyActive === "true") conditions.push(eq(lawFirmAssignments.active, true))

  const rows = await db
    .select({
      id: lawFirmAssignments.id,
      firmId: lawFirmAssignments.firmId,
      agreementId: lawFirmAssignments.agreementId,
      scope: lawFirmAssignments.scope,
      active: lawFirmAssignments.active,
      createdAt: lawFirmAssignments.createdAt,
      updatedAt: lawFirmAssignments.updatedAt,
      title: agreements.title,
      status: agreements.status,
      agreementCreatedAt: agreements.createdAt,
    })
    .from(lawFirmAssignments)
    .leftJoin(agreements, eq(agreements.id, lawFirmAssignments.agreementId))
    .where(conditions.length ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
    .orderBy((table, { desc }) => desc(lawFirmAssignments.createdAt))

  return NextResponse.json({
    agreements: rows.map((row) => ({
      id: row.agreementId,
      title: row.title,
      status: row.status,
      createdAt: row.agreementCreatedAt,
      scope: row.scope,
      active: row.active,
      assignmentId: row.id,
    })),
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { firmId, agreementId, scope = "legal_resolution", active = true } = body || {}
  if (!firmId || !agreementId) return NextResponse.json({ error: "Missing firmId or agreementId" }, { status: 400 })

  const existing = await db.query.lawFirmAssignments.findFirst({
    where: (table, { and, eq }) => and(eq(table.firmId, firmId), eq(table.agreementId, agreementId), eq(table.scope, scope)),
  })

  if (existing) {
    await db
      .update(lawFirmAssignments)
      .set({ active, scope, updatedAt: new Date() })
      .where(eq(lawFirmAssignments.id, existing.id))
    return NextResponse.json({ ok: true, id: existing.id, updated: true })
  }

  const [created] = await db
    .insert(lawFirmAssignments)
    .values({
      id: randomUUID(),
      firmId,
      agreementId,
      scope,
      active,
    })
    .returning()

  return NextResponse.json({ ok: true, id: created.id })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, active, scope } = body || {}
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  await db
    .update(lawFirmAssignments)
    .set({
      ...(active === undefined ? {} : { active }),
      ...(scope ? { scope } : {}),
      updatedAt: new Date(),
    })
    .where(eq(lawFirmAssignments.id, id))

  return NextResponse.json({ ok: true })
}
