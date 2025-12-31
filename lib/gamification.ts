import { db } from "./db"
import { agreements, referrals, users } from "./db/schema"
import { eq, count, and, gte } from "drizzle-orm"
import { subDays } from "date-fns"

// Re-export types and constants from the client-safe file
export type { BadgeType, Badge } from "./gamification-types"
export { BADGES } from "./gamification-types"

// Check and award badges for a user
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const newBadges: Badge[] = []

  // Get user's current badges (you'll need to add this to your schema)
  // For now, we'll check all conditions

  // Check agreement count badges
  const agreementCount = await db
    .select({ count: count() })
    .from(agreements)
    .where(eq(agreements.userId, userId))

  const total = agreementCount[0]?.count || 0

  if (total >= 1) {
    newBadges.push({ ...BADGES.first_agreement, unlockedAt: new Date() })
  }
  if (total >= 5) {
    newBadges.push({ ...BADGES.agreement_master_5, unlockedAt: new Date() })
  }
  if (total >= 10) {
    newBadges.push({ ...BADGES.agreement_master_10, unlockedAt: new Date() })
  }
  if (total >= 25) {
    newBadges.push({ ...BADGES.agreement_master_25, unlockedAt: new Date() })
  }

  // Check speed demon (3 agreements in one day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayCount = await db
    .select({ count: count() })
    .from(agreements)
    .where(
      and(
        eq(agreements.userId, userId),
        gte(agreements.createdAt, today)
      )
    )

  if ((todayCount[0]?.count || 0) >= 3) {
    newBadges.push({ ...BADGES.speed_demon, unlockedAt: new Date() })
  }

  // Check referral champion
  const referralCount = await db
    .select({ count: count() })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, "rewarded")
      )
    )

  if ((referralCount[0]?.count || 0) >= 10) {
    newBadges.push({ ...BADGES.referral_champion, unlockedAt: new Date() })
  }

  return newBadges
}

// Get user's progress towards next badges
export async function getUserProgress(userId: string) {
  const agreementCount = await db
    .select({ count: count() })
    .from(agreements)
    .where(eq(agreements.userId, userId))

  const referralCount = await db
    .select({ count: count() })
    .from(referrals)
    .where(
      and(
        eq(referrals.referrerId, userId),
        eq(referrals.status, "rewarded")
      )
    )

  const total = agreementCount[0]?.count || 0
  const refs = referralCount[0]?.count || 0

  return {
    agreements: {
      current: total,
      nextMilestone: total < 5 ? 5 : total < 10 ? 10 : 25,
      progress: total < 5 ? (total / 5) * 100 : total < 10 ? ((total - 5) / 5) * 100 : ((total - 10) / 15) * 100,
    },
    referrals: {
      current: refs,
      nextMilestone: 10,
      progress: (refs / 10) * 100,
    },
  }
}

