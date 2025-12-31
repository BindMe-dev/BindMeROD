import { randomUUID } from "crypto"
import { eq } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      // Return empty notifications instead of 401 to match other APIs
      return NextResponse.json({ notifications: [] })
    }

    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      limit: 100,
      orderBy: (table, { desc }) => desc(table.createdAt),
    })

    return NextResponse.json({ notifications: rows })
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { type, title, message, agreementId, priority, category, requiresAction } = await request.json()
    if (!type || !title || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        id: randomUUID(),
        userId,
        type,
        priority: priority === "urgent" ? "urgent" : "normal",
        category: category || (requiresAction ? "action" : "update"),
        requiresAction: requiresAction === true,
        handledAt: null,
        title,
        message,
        agreementId: agreementId || null,
      })
      .returning()

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("[NOTIFICATIONS_POST]", error)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}
