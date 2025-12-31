import { db } from "./db"
import { referrals, referralRewards, users } from "./db/schema"
import { eq, and, count, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

export type ReferralStatus = "pending" | "completed" | "rewarded"
export type RewardType = "premium_month" | "discount_25" | "discount_50" | "lifetime_free"

// Generate a unique referral code
export function generateReferralCode(): string {
  return nanoid(10).toUpperCase()
}

// Create a referral link for a user
export async function createReferralLink(userId: string): Promise<string> {
  // Check if user already has a referral code
  const existing = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "pending")))
    .limit(1)

  if (existing.length > 0) {
    return existing[0].referralCode
  }

  // Create new referral code
  const code = generateReferralCode()
  
  await db.insert(referrals).values({
    id: nanoid(),
    referrerId: userId,
    referralCode: code,
    status: "pending",
    clickCount: 0,
  })

  return code
}

// Track referral click
export async function trackReferralClick(code: string): Promise<void> {
  await db
    .update(referrals)
    .set({
      clickCount: sql`${referrals.clickCount} + 1`,
    })
    .where(eq(referrals.referralCode, code))
}

// Complete a referral (when referee signs up)
export async function completeReferral(code: string, refereeId: string): Promise<void> {
  const referral = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referralCode, code))
    .limit(1)

  if (referral.length === 0) {
    throw new Error("Referral code not found")
  }

  const ref = referral[0]

  // Update referral status
  await db
    .update(referrals)
    .set({
      refereeId,
      status: "completed",
    })
    .where(eq(referrals.id, ref.id))

  // Award rewards to both parties
  await awardReferralRewards(ref.id, ref.referrerId, refereeId)
}

// Award rewards to referrer and referee
async function awardReferralRewards(
  referralId: string,
  referrerId: string,
  refereeId: string
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 3) // Rewards expire in 3 months

  // Award to referrer (1 month premium)
  await db.insert(referralRewards).values({
    id: nanoid(),
    userId: referrerId,
    referralId,
    rewardType: "premium_month",
    status: "active",
    expiresAt,
  })

  // Award to referee (1 month premium)
  await db.insert(referralRewards).values({
    id: nanoid(),
    userId: refereeId,
    referralId,
    rewardType: "premium_month",
    status: "active",
    expiresAt,
  })

  // Check for milestone rewards
  await checkMilestoneRewards(referrerId)

  // Mark referral as rewarded
  await db
    .update(referrals)
    .set({
      status: "rewarded",
      rewardedAt: new Date(),
    })
    .where(eq(referrals.id, referralId))
}

// Check and award milestone rewards
async function checkMilestoneRewards(userId: string): Promise<void> {
  // Count completed referrals
  const completedCount = await db
    .select({ count: count() })
    .from(referrals)
    .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "rewarded")))

  const total = completedCount[0]?.count || 0

  // Award milestone rewards
  if (total === 3) {
    await db.insert(referralRewards).values({
      id: nanoid(),
      userId,
      referralId: nanoid(), // Milestone reward, not tied to specific referral
      rewardType: "discount_25",
      status: "active",
    })
  } else if (total === 5) {
    await db.insert(referralRewards).values({
      id: nanoid(),
      userId,
      referralId: nanoid(),
      rewardType: "discount_50",
      status: "active",
    })
  } else if (total === 10) {
    await db.insert(referralRewards).values({
      id: nanoid(),
      userId,
      referralId: nanoid(),
      rewardType: "lifetime_free",
      status: "active",
    })
  }
}

// Get user's referral stats
export async function getReferralStats(userId: string) {
  const [referralCount, rewardCount, activeRewards] = await Promise.all([
    db
      .select({ count: count() })
      .from(referrals)
      .where(and(eq(referrals.referrerId, userId), eq(referrals.status, "rewarded"))),
    
    db
      .select({ count: count() })
      .from(referralRewards)
      .where(eq(referralRewards.userId, userId)),
    
    db
      .select()
      .from(referralRewards)
      .where(and(eq(referralRewards.userId, userId), eq(referralRewards.status, "active"))),
  ])

  return {
    totalReferrals: referralCount[0]?.count || 0,
    totalRewards: rewardCount[0]?.count || 0,
    activeRewards: activeRewards || [],
  }
}

