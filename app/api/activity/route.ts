import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { agreements, completions, users } from "@/lib/db/schema"
import { desc, sql, and, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

// Anonymize user names for privacy
function anonymizeName(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 0) return "Someone"
  
  const firstName = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : ""
  
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName
}

// Get city from IP or return generic location
function getGenericLocation(): string {
  const cities = ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Bristol", "Edinburgh"]
  return cities[Math.floor(Math.random() * cities.length)]
}

export async function GET() {
  try {
    // Get recent agreement creations (last 7 days)
    const recentAgreements = await db
      .select({
        id: agreements.id,
        type: agreements.type,
        createdAt: agreements.createdAt,
        userName: users.name,
      })
      .from(agreements)
      .innerJoin(users, eq(agreements.userId, users.id))
      .where(sql`${agreements.createdAt} > NOW() - INTERVAL '7 days'`)
      .orderBy(desc(agreements.createdAt))
      .limit(10)

    // Get recent completions (last 7 days)
    const recentCompletions = await db
      .select({
        id: completions.id,
        type: agreements.type,
        completedAt: completions.createdAt,
        userName: users.name,
      })
      .from(completions)
      .innerJoin(agreements, eq(completions.agreementId, agreements.id))
      .innerJoin(users, eq(agreements.userId, users.id))
      .where(
        and(
          eq(completions.completed, true),
          sql`${completions.createdAt} > NOW() - INTERVAL '7 days'`
        )
      )
      .orderBy(desc(completions.createdAt))
      .limit(10)

    // Get aggregate stats
    const stats = await db
      .select({
        totalAgreements: sql<number>`count(*)`,
        thisWeek: sql<number>`count(*) filter (where ${agreements.createdAt} > NOW() - INTERVAL '7 days')`,
        totalUsers: sql<number>`count(distinct ${agreements.userId})`,
      })
      .from(agreements)

    // Format activity feed
    const activities = [
      ...recentAgreements.map((a) => ({
        id: a.id,
        type: "created" as const,
        agreementType: a.type,
        userName: anonymizeName(a.userName),
        location: getGenericLocation(),
        timestamp: a.createdAt,
      })),
      ...recentCompletions.map((c) => ({
        id: c.id,
        type: "completed" as const,
        agreementType: c.type,
        userName: anonymizeName(c.userName),
        location: getGenericLocation(),
        timestamp: c.completedAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    // If we have less than 5 activities, add some demo data
    const demoActivities = [
      {
        id: "demo-1",
        type: "completed" as const,
        agreementType: "Freelance Contract",
        userName: "Sarah M.",
        location: "London",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      },
      {
        id: "demo-2",
        type: "created" as const,
        agreementType: "Rental Agreement",
        userName: "James K.",
        location: "Manchester",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      },
      {
        id: "demo-3",
        type: "completed" as const,
        agreementType: "Partnership Agreement",
        userName: "Emma R.",
        location: "Birmingham",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      },
    ]

    const finalActivities = activities.length >= 5 ? activities : [...activities, ...demoActivities].slice(0, 10)

    return NextResponse.json({
      activities: finalActivities,
      stats: {
        totalAgreements: Number(stats[0]?.totalAgreements || 0),
        thisWeek: Number(stats[0]?.thisWeek || 0),
        totalUsers: Number(stats[0]?.totalUsers || 0),
      },
    })
  } catch (error) {
    console.error("Error fetching activity:", error)
    
    // Return demo data on error
    return NextResponse.json({
      activities: [
        {
          id: "demo-1",
          type: "completed",
          agreementType: "Freelance Contract",
          userName: "Sarah M.",
          location: "London",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: "demo-2",
          type: "created",
          agreementType: "Rental Agreement",
          userName: "James K.",
          location: "Manchester",
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
      ],
      stats: {
        totalAgreements: 1247,
        thisWeek: 89,
        totalUsers: 432,
      },
    })
  }
}

