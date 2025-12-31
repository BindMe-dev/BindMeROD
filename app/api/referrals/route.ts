import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server-auth"
import { createReferralLink, getReferralStats } from "@/lib/referrals"
import { db } from "@/lib/db"
import { referrals, referralRewards } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"

// GET /api/referrals - Get user's referral data
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create referral code
    const code = await createReferralLink(userId)

    // Get referral stats
    const stats = await getReferralStats(userId)

    // Get referral history
    const history = await db
      .select({
        id: referrals.id,
        refereeId: referrals.refereeId,
        status: referrals.status,
        clickCount: referrals.clickCount,
        createdAt: referrals.createdAt,
        rewardedAt: referrals.rewardedAt,
      })
      .from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(50)

    // Get active rewards
    const rewards = await db
      .select()
      .from(referralRewards)
      .where(and(eq(referralRewards.userId, userId), eq(referralRewards.status, "active")))
      .orderBy(desc(referralRewards.createdAt))

    // Build referral URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const referralUrl = `${baseUrl}/signup?ref=${code}`

    return NextResponse.json({
      referralCode: code,
      referralUrl,
      stats,
      history,
      rewards,
    })
  } catch (error) {
    console.error("Error fetching referrals:", error)
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 })
  }
}

