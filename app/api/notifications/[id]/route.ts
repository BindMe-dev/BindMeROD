import { and, eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications, users } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { read, handled } = await request.json()

    const updated = await db
      .update(notifications)
      .set({
        read: read === true,
        handledAt: handled === true ? new Date() : undefined,
      })
      .where(and(eq(notifications.id, params.id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id })

    if (updated.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const params = await context.params
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id, params.id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id })

    if (deleted.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[NOTIFICATIONS_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
  }
}
