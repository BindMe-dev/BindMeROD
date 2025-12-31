import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, referrals, userBadges } from "@/lib/db/schema"
import { eq, desc, count, sql } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "referrals"
    const limit = parseInt(searchParams.get("limit") || "10")

    if (type === "referrals") {
      // Top referrers leaderboard
      const topReferrers = await db
        .select({
          userId: referrals.referrerId,
          userName: users.name,
          isVerified: users.isVerified,
          referralCount: count(referrals.id),
        })
        .from(referrals)
        .innerJoin(users, eq(referrals.referrerId, users.id))
        .where(eq(referrals.status, "rewarded"))
        .groupBy(referrals.referrerId, users.name, users.isVerified)
        .orderBy(desc(count(referrals.id)))
        .limit(limit)

      return NextResponse.json({
        type: "referrals",
        leaderboard: topReferrers.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          userName: entry.userName,
          isVerified: entry.isVerified,
          score: entry.referralCount,
          label: `${entry.referralCount} referrals`,
        })),
      })
    }

    if (type === "badges") {
      // Most badges leaderboard
      const topBadgeEarners = await db
        .select({
          userId: userBadges.userId,
          userName: users.name,
          isVerified: users.isVerified,
          badgeCount: count(userBadges.id),
        })
        .from(userBadges)
        .innerJoin(users, eq(userBadges.userId, users.id))
        .groupBy(userBadges.userId, users.name, users.isVerified)
        .orderBy(desc(count(userBadges.id)))
        .limit(limit)

      return NextResponse.json({
        type: "badges",
        leaderboard: topBadgeEarners.map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          userName: entry.userName,
          isVerified: entry.isVerified,
          score: entry.badgeCount,
          label: `${entry.badgeCount} badges`,
        })),
      })
    }

    if (type === "agreements") {
      // Most agreements leaderboard
      const topUsers = await db
        .select({
          id: users.id,
          name: users.name,
          isVerified: users.isVerified,
          agreementCount: users.agreementCount,
        })
        .from(users)
        .orderBy(desc(users.agreementCount))
        .limit(limit)

      return NextResponse.json({
        type: "agreements",
        leaderboard: topUsers.map((entry, index) => ({
          rank: index + 1,
          userId: entry.id,
          userName: entry.name,
          isVerified: entry.isVerified,
          score: entry.agreementCount,
          label: `${entry.agreementCount} agreements`,
        })),
      })
    }

    return NextResponse.json({ error: "Invalid leaderboard type" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}

