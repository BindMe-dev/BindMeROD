import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, lawFirmAds } from "@/lib/db/schema"
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
  const rows = await db.query.lawFirmAds.findMany({
    where: firmId ? (lawFirmAds, { eq }) => eq(lawFirmAds.firmId, firmId) : undefined,
    orderBy: (table, { desc }) => desc(table.createdAt),
  })
  return NextResponse.json({ ads: rows })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, firmId, title, body: adBody, ctaText, ctaUrl, active = true } = body || {}
  if (!firmId || !title || !adBody) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  if (id) {
    await db
      .update(lawFirmAds)
      .set({ title, body: adBody, ctaText, ctaUrl, active, updatedAt: new Date() })
      .where(eq(lawFirmAds.id, id))
    return NextResponse.json({ ok: true, id })
  }

  const [created] = await db
    .insert(lawFirmAds)
    .values({
      id: randomUUID(),
      firmId,
      title,
      body: adBody,
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      active,
    })
    .returning()

  return NextResponse.json({ ad: created })
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })
  const body = await request.json().catch(() => ({}))
  const { id, active } = body || {}
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  await db.update(lawFirmAds).set({ active, updatedAt: new Date() }).where(eq(lawFirmAds.id, id))
  return NextResponse.json({ ok: true })
}
