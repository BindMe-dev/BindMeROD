import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { admins, users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

async function requireAdmin(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) return { ok: false, status: 401 }
  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, userId) })
  if (!admin) return { ok: false, status: 403 }
  return { ok: true }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: auth.status })

    const { email } = await request.json().catch(() => ({}))
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const existing = await db.query.admins.findFirst({ where: eq(admins.userId, user.id) })
    if (existing) return NextResponse.json({ ok: true, admin: existing })

    const [created] = await db
      .insert(admins)
      .values({ id: randomUUID(), userId: user.id, role: "admin" })
      .returning()

    return NextResponse.json({ ok: true, admin: created })
  } catch (error) {
    console.error("[ADMIN_PROMOTE_EMAIL_POST]", error)
    return NextResponse.json({ error: "Failed to promote by email" }, { status: 500 })
  }
}
