-- Add gamification tables for badges and achievements

-- User Badges table
CREATE TABLE IF NOT EXISTS "UserBadge" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- User Stats table (for tracking streaks, shares, etc.)
CREATE TABLE IF NOT EXISTS "UserStats" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "loginStreak" INTEGER NOT NULL DEFAULT 0,
  "lastLoginAt" TIMESTAMP,
  "certificatesShared" INTEGER NOT NULL DEFAULT 0,
  "totalAgreements" INTEGER NOT NULL DEFAULT 0,
  "totalReferrals" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");
CREATE INDEX IF NOT EXISTS "UserBadge_badgeId_idx" ON "UserBadge"("badgeId");
CREATE UNIQUE INDEX IF NOT EXISTS "UserBadge_userId_badgeId_idx" ON "UserBadge"("userId", "badgeId");
CREATE INDEX IF NOT EXISTS "UserStats_userId_idx" ON "UserStats"("userId");

-- Comments
COMMENT ON TABLE "UserBadge" IS 'Tracks badges earned by users';
COMMENT ON TABLE "UserStats" IS 'Tracks user statistics for gamification';
COMMENT ON COLUMN "UserStats"."loginStreak" IS 'Current consecutive days logged in';
COMMENT ON COLUMN "UserStats"."certificatesShared" IS 'Total number of certificates shared on social media';

