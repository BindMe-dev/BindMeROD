import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, lawFirmContacts } from "@/lib/db/schema"
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
  const rows = await db.query.lawFirmContacts.findMany({
    where: firmId ? (lawFirmContacts, { eq }) => eq(lawFirmContacts.firmId, firmId) : undefined,
    orderBy: (table, { asc }) => asc(table.priority),
  })
  return NextResponse.json({ contacts: rows })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, firmId, name, email, phone, role, priority = 1, onCall = false } = body || {}
  if (!firmId || !name || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  if (id) {
    await db
      .update(lawFirmContacts)
      .set({ firmId, name, email, phone, role, priority, onCall })
      .where(eq(lawFirmContacts.id, id))
    return NextResponse.json({ ok: true, id })
  }

  const [created] = await db
    .insert(lawFirmContacts)
    .values({ id: randomUUID(), firmId, name, email, phone, role, priority, onCall })
    .returning()
  return NextResponse.json({ contact: created })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await db.delete(lawFirmContacts).where(eq(lawFirmContacts.id, id))
  return NextResponse.json({ ok: true })
}
