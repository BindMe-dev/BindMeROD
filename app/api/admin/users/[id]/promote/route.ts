import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

async function requireAdmin(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return { ok: false, status: 401 }
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
  if (!admin) return { ok: false, status: 403 }
  return { ok: true }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

    const userId = params.id
    const existing = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
    if (existing) {
      return NextResponse.json({ ok: true, admin: existing })
    }

    const [admin] = await db
      .insert(admins)
      .values({
        id: randomUUID(),
        userId,
        role: "admin",
      })
      .returning()

    return NextResponse.json({ ok: true, admin })
  } catch (error) {
    console.error("[ADMIN_PROMOTE_POST]", error)
    return NextResponse.json({ error: "Failed to promote user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

    const userId = params.id
    await db.delete(admins).where(eq(admins.userId, userId))
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[ADMIN_PROMOTE_DELETE]", error)
    return NextResponse.json({ error: "Failed to demote user" }, { status: 500 })
  }
}
