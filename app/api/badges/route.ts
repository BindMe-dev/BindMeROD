import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { checkAndAwardBadges, getUserProgress } from "@/lib/gamification"
import { db } from "@/lib/db"
import { userBadges } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check for new badges
    const newBadges = await checkAndAwardBadges(userId)

    // Get existing badges from database
    const existingBadges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))

    // Get progress
    const progress = await getUserProgress(userId)

    return NextResponse.json({
      unlockedBadges: existingBadges.map((b) => ({
        id: b.badgeId,
        unlockedAt: b.unlockedAt,
      })),
      newBadges: newBadges.filter(
        (nb) => !existingBadges.some((eb) => eb.badgeId === nb.id)
      ),
      progress,
    })
  } catch (error) {
    console.error("Error fetching badges:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}

