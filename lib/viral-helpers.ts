// Helper functions to easily integrate viral features into your app

import { checkAndAwardBadges } from "./gamification"
import { completeReferral } from "./referrals"
import { sendTemplateEmail } from "./email-sender"
import { getAgreementCompletedEmail, getReferralRewardEmail, getMilestoneEmail } from "./email-templates"
import { db } from "./db"
import { userBadges, userStats } from "./db/schema"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

// Call this after a user creates an agreement
export async function onAgreementCreated(userId: string, agreementId: string) {
  try {
    // Update user stats
    await db
      .update(userStats)
      .set({
        totalAgreements: sql`${userStats.totalAgreements} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))

    // Check and award badges
    const newBadges = await checkAndAwardBadges(userId)
    
    // Save new badges to database
    for (const badge of newBadges) {
      const existing = await db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId))
        .where(eq(userBadges.badgeId, badge.id))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(userBadges).values({
          id: nanoid(),
          userId,
          badgeId: badge.id,
        })

        // TODO: Send badge notification email
        console.log(`🏆 Badge unlocked: ${badge.name}`)
      }
    }

    console.log(`✅ Agreement created: ${agreementId}`)
  } catch (error) {
    console.error("Error in onAgreementCreated:", error)
  }
}

// Call this after a user completes an agreement
export async function onAgreementCompleted(
  userId: string,
  agreementId: string,
  agreementType: string,
  userEmail: string,
  userName: string
) {
  try {
    // Generate certificate URL
    const certificateUrl = `${process.env.NEXTAUTH_URL}/api/certificates/${agreementId}`

    // Send completion email
    const email = getAgreementCompletedEmail({
      userName,
      agreementType,
      agreementId,
      certificateUrl,
    })

    await sendTemplateEmail(userEmail, email)

    // Check for new badges
    await onAgreementCreated(userId, agreementId)

    console.log(`✅ Agreement completed: ${agreementId}`)
  } catch (error) {
    console.error("Error in onAgreementCompleted:", error)
  }
}

// Call this after a user signs up (check for referral)
export async function onUserSignUp(
  userId: string,
  userEmail: string,
  referralCode?: string
) {
  try {
    // Create user stats record
    await db.insert(userStats).values({
      id: nanoid(),
      userId,
      loginStreak: 1,
      lastLoginAt: new Date(),
    })

    // Complete referral if exists
    if (referralCode) {
      await completeReferral(referralCode, userId)
      console.log(`🎁 Referral completed: ${referralCode}`)
    }

    console.log(`✅ User signed up: ${userId}`)
  } catch (error) {
    console.error("Error in onUserSignUp:", error)
  }
}

// Call this when a user shares a certificate
export async function onCertificateShared(userId: string, platform: string) {
  try {
    // Update stats
    await db
      .update(userStats)
      .set({
        certificatesShared: sql`${userStats.certificatesShared} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(userStats.userId, userId))

    // Check for social butterfly badge
    const newBadges = await checkAndAwardBadges(userId)
    
    for (const badge of newBadges) {
      if (badge.id === "social_butterfly") {
        await db.insert(userBadges).values({
          id: nanoid(),
          userId,
          badgeId: badge.id,
        })
        console.log(`🏆 Social Butterfly badge unlocked!`)
      }
    }

    console.log(`📤 Certificate shared on ${platform}`)
  } catch (error) {
    console.error("Error in onCertificateShared:", error)
  }
}

// Call this when a user logs in
export async function onUserLogin(userId: string) {
  try {
    const stats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1)

    if (stats.length === 0) {
      // Create stats if doesn't exist
      await db.insert(userStats).values({
        id: nanoid(),
        userId,
        loginStreak: 1,
        lastLoginAt: new Date(),
      })
      return
    }

    const userStat = stats[0]
    const lastLogin = userStat.lastLoginAt
    const now = new Date()

    if (!lastLogin) {
      await db
        .update(userStats)
        .set({
          loginStreak: 1,
          lastLoginAt: now,
        })
        .where(eq(userStats.userId, userId))
      return
    }

    // Check if login is consecutive day
    const daysSinceLastLogin = Math.floor(
      (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceLastLogin === 1) {
      // Consecutive day - increment streak
      await db
        .update(userStats)
        .set({
          loginStreak: sql`${userStats.loginStreak} + 1`,
          lastLoginAt: now,
        })
        .where(eq(userStats.userId, userId))
    } else if (daysSinceLastLogin > 1) {
      // Streak broken - reset
      await db
        .update(userStats)
        .set({
          loginStreak: 1,
          lastLoginAt: now,
        })
        .where(eq(userStats.userId, userId))
    }
    // Same day - do nothing

    console.log(`✅ User logged in: ${userId}`)
  } catch (error) {
    console.error("Error in onUserLogin:", error)
  }
}

// Get referral code from URL or session
export function getReferralCodeFromRequest(searchParams: URLSearchParams): string | null {
  return searchParams.get("ref")
}

// Store referral code in session storage (client-side)
export function storeReferralCode(code: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("referralCode", code)
  }
}

// Get stored referral code (client-side)
export function getStoredReferralCode(): string | null {
  if (typeof window !== "undefined") {
    return sessionStorage.getItem("referralCode")
  }
  return null
}

// Clear stored referral code (client-side)
export function clearStoredReferralCode() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("referralCode")
  }
}

