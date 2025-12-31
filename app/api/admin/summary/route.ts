import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { agreements, users, admins } from "@/lib/db/schema"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await db.query.admins.findFirst({
      where: eq(admins.userId, userId),
    })
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const agreementsData = await db
      .select({
        id: agreements.id,
        title: agreements.title,
        status: agreements.status,
        createdAt: agreements.createdAt,
      })
      .from(agreements)
      .limit(100)

    const usersData = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        verificationType: users.verificationType,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(100)

    const stats = agreementsData.reduce(
      (acc, item) => {
        acc.total += 1
        const key = item.status || "unknown"
        acc.byStatus[key] = (acc.byStatus[key] || 0) + 1
        return acc
      },
      { total: 0, byStatus: {} as Record<string, number> },
    )

    const pendingVerifications = usersData
      .filter((u) => !u.verificationType)
      .slice(0, 10)

    const recentAgreements = agreementsData
      .slice(0, 8)
      .map((a) => ({ ...a }))

    return NextResponse.json({
      stats,
      pendingVerifications,
      recentAgreements,
    })
  } catch (error) {
    console.error("[ADMIN_SUMMARY]", error)
    return NextResponse.json({ error: "Failed to load admin summary" }, { status: 500 })
  }
}
