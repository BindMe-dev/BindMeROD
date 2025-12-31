-- Add referral system tables
-- Migration: add_referral_system
-- Created: 2025-12-30

-- Create Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
  "id" TEXT PRIMARY KEY,
  "referrerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "refereeId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "referralCode" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "rewardType" TEXT,
  "rewardedAt" TIMESTAMP,
  "clickCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create ReferralReward table
CREATE TABLE IF NOT EXISTS "ReferralReward" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "referralId" TEXT NOT NULL REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "rewardType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "expiresAt" TIMESTAMP,
  "appliedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX IF NOT EXISTS "Referral_refereeId_idx" ON "Referral"("refereeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referralCode_idx" ON "Referral"("referralCode");

CREATE INDEX IF NOT EXISTS "ReferralReward_userId_idx" ON "ReferralReward"("userId");
CREATE INDEX IF NOT EXISTS "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");

-- Add comments
COMMENT ON TABLE "Referral" IS 'Tracks user referrals and their status';
COMMENT ON TABLE "ReferralReward" IS 'Tracks rewards earned from referrals';
COMMENT ON COLUMN "Referral"."status" IS 'pending: link created, completed: referee signed up, rewarded: rewards distributed';
COMMENT ON COLUMN "Referral"."rewardType" IS 'Type of reward: premium_month, discount_25, discount_50, lifetime_free';

