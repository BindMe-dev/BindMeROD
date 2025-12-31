import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, lawFirms } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

async function requireAdmin(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return { ok: false, status: 401 }
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
  if (!admin) return { ok: false, status: 403 }
  return { ok: true, admin }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

  const rows = await db.query.lawFirms.findMany({
    orderBy: (table, { desc }) => desc(table.createdAt),
  })
  return NextResponse.json({ firms: rows })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { name, contact, email, phone, status = "onboarding", region = "UK", matters = 0, id } = body || {}

  if (!name || !contact || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (id) {
    await db
      .update(lawFirms)
      .set({
        name,
        contact,
        email,
        phone,
        status,
        region,
        matters,
        updatedAt: new Date(),
      })
      .where(eq(lawFirms.id, id))
    return NextResponse.json({ ok: true, id })
  }

  const [created] = await db
    .insert(lawFirms)
    .values({
      id: randomUUID(),
      name,
      contact,
      email,
      phone,
      status,
      region,
      matters,
    })
    .returning()

  return NextResponse.json({ ok: true, id: created.id })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, status } = body || {}
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 })

  await db.update(lawFirms).set({ status, updatedAt: new Date() }).where(eq(lawFirms.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await db.delete(lawFirms).where(eq(lawFirms.id, id))
  return NextResponse.json({ ok: true })
}
