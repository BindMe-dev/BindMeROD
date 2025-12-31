import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, users, lawFirmAssignments } from "@/lib/db/schema"
import { eq, sql, and, gte, lte, desc } from "drizzle-orm"
import { getUserIdFromRequest } from "@/lib/server-auth"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // 7d, 30d, 90d, 1y

    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Overall metrics
    const totalUsers = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .then(r => r[0]?.count || 0)

    const totalAgreements = await db.select({ count: sql<number>`count(*)` })
      .from(agreements)
      .then(r => r[0]?.count || 0)

    const activeAgreements = await db.select({ count: sql<number>`count(*)` })
      .from(agreements)
      .where(eq(agreements.status, "active"))
      .then(r => r[0]?.count || 0)

    const disputedAgreements = await db.select({ count: sql<number>`count(*)` })
      .from(agreements)
      .where(eq(agreements.status, "disputed"))
      .then(r => r[0]?.count || 0)

    // Agreement trends (last 30 days)
    const agreementTrends = await db.select({
      date: sql<string>`DATE(${agreements.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(agreements)
      .where(gte(agreements.createdAt, startDate))
      .groupBy(sql`DATE(${agreements.createdAt})`)
      .orderBy(sql`DATE(${agreements.createdAt})`)

    // Agreement by type
    const agreementsByType = await db.select({
      type: agreements.type,
      count: sql<number>`count(*)`,
    })
      .from(agreements)
      .groupBy(agreements.type)

    // Agreement by status
    const agreementsByStatus = await db.select({
      status: agreements.status,
      count: sql<number>`count(*)`,
    })
      .from(agreements)
      .groupBy(agreements.status)

    // User growth trends
    const userGrowth = await db.select({
      date: sql<string>`DATE(${users.createdAt})`,
      count: sql<number>`count(*)`,
    })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`)

    // Top users by agreement count
    const topUsers = await db.select({
      userId: agreements.userId,
      userName: users.name,
      userEmail: users.email,
      agreementCount: sql<number>`count(*)`,
    })
      .from(agreements)
      .leftJoin(users, eq(agreements.userId, users.id))
      .groupBy(agreements.userId, users.name, users.email)
      .orderBy(desc(sql`count(*)`))
      .limit(10)

    // Legal resolution metrics
    const legalMetrics = await db.select({
      totalAssignments: sql<number>`count(*)`,
      pendingAssignments: sql<number>`count(*) filter (where ${lawFirmAssignments.status} = 'pending')`,
      activeAssignments: sql<number>`count(*) filter (where ${lawFirmAssignments.status} = 'active')`,
      resolvedAssignments: sql<number>`count(*) filter (where ${lawFirmAssignments.status} = 'resolved')`,
    })
      .from(lawFirmAssignments)
      .then(r => r[0] || { totalAssignments: 0, pendingAssignments: 0, activeAssignments: 0, resolvedAssignments: 0 })

    return NextResponse.json({
      overview: {
        totalUsers,
        totalAgreements,
        activeAgreements,
        disputedAgreements,
      },
      trends: {
        agreements: agreementTrends,
        users: userGrowth,
      },
      distribution: {
        byType: agreementsByType,
        byStatus: agreementsByStatus,
      },
      topUsers,
      legalMetrics,
      period,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}

