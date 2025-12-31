-- Smart Connections & Network Intelligence Tables
-- Migration: Add tables for connection tracking and network analytics

-- User Connections Table
CREATE TABLE IF NOT EXISTS "UserConnection" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "connectedUserId" TEXT NOT NULL,
  "connectionStrength" DECIMAL(3,2) DEFAULT 0.0,
  "mutualAgreements" INTEGER DEFAULT 0,
  "trustScore" DECIMAL(3,2) DEFAULT 0.0,
  "lastInteraction" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("connectedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE("userId", "connectedUserId")
);

CREATE INDEX "UserConnection_userId_idx" ON "UserConnection"("userId");
CREATE INDEX "UserConnection_connectedUserId_idx" ON "UserConnection"("connectedUserId");
CREATE INDEX "UserConnection_trustScore_idx" ON "UserConnection"("trustScore" DESC);

-- Connection Suggestions Table
CREATE TABLE IF NOT EXISTS "ConnectionSuggestion" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "suggestedUserId" TEXT NOT NULL,
  "reason" TEXT NOT NULL, -- 'mutual_connection', 'similar_agreements', 'geographic_proximity', 'industry_match'
  "confidenceScore" DECIMAL(3,2) DEFAULT 0.0,
  "mutualConnectionIds" TEXT[], -- Array of user IDs
  "sharedInterests" TEXT[],
  "dismissed" BOOLEAN DEFAULT FALSE,
  "dismissedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("suggestedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "ConnectionSuggestion_userId_idx" ON "ConnectionSuggestion"("userId");
CREATE INDEX "ConnectionSuggestion_dismissed_idx" ON "ConnectionSuggestion"("dismissed");
CREATE INDEX "ConnectionSuggestion_confidenceScore_idx" ON "ConnectionSuggestion"("confidenceScore" DESC);

-- Network Analytics Table
CREATE TABLE IF NOT EXISTS "NetworkAnalytics" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "period" TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  "periodStart" TIMESTAMP NOT NULL,
  "periodEnd" TIMESTAMP NOT NULL,
  "totalConnections" INTEGER DEFAULT 0,
  "activeConnections" INTEGER DEFAULT 0,
  "newConnections" INTEGER DEFAULT 0,
  "avgTrustScore" DECIMAL(3,2) DEFAULT 0.0,
  "networkGrowthRate" DECIMAL(5,2) DEFAULT 0.0,
  "networkHealth" TEXT, -- 'excellent', 'good', 'fair', 'poor'
  "calculatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NetworkAnalytics_userId_period_idx" ON "NetworkAnalytics"("userId", "period");
CREATE INDEX "NetworkAnalytics_periodStart_idx" ON "NetworkAnalytics"("periodStart" DESC);

-- Partner Analytics Table
CREATE TABLE IF NOT EXISTS "PartnerAnalytics" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "partnerId" TEXT NOT NULL,
  "totalAgreements" INTEGER DEFAULT 0,
  "completedAgreements" INTEGER DEFAULT 0,
  "completionRate" DECIMAL(3,2) DEFAULT 0.0,
  "avgResponseTime" DECIMAL(10,2) DEFAULT 0.0, -- in hours
  "trustScore" DECIMAL(3,2) DEFAULT 0.0,
  "lastAgreementDate" TIMESTAMP,
  "responseTimeImproving" BOOLEAN DEFAULT FALSE,
  "completionRateImproving" BOOLEAN DEFAULT FALSE,
  "activityIncreasing" BOOLEAN DEFAULT FALSE,
  "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("partnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE("userId", "partnerId")
);

CREATE INDEX "PartnerAnalytics_userId_idx" ON "PartnerAnalytics"("userId");
CREATE INDEX "PartnerAnalytics_trustScore_idx" ON "PartnerAnalytics"("trustScore" DESC);
CREATE INDEX "PartnerAnalytics_completionRate_idx" ON "PartnerAnalytics"("completionRate" DESC);

-- User Navigation History Table (for smart routing)
CREATE TABLE IF NOT EXISTS "NavigationHistory" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "duration" INTEGER, -- seconds spent on page
  "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "NavigationHistory_userId_timestamp_idx" ON "NavigationHistory"("userId", "timestamp" DESC);
CREATE INDEX "NavigationHistory_path_idx" ON "NavigationHistory"("path");

-- Pending Actions Table (for smart routing)
CREATE TABLE IF NOT EXISTS "PendingAction" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'signature_needed', 'dispute_active', 'verification_pending', 'payment_due', 'response_needed'
  "agreementId" TEXT,
  "priority" TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  "dueDate" TIMESTAMP,
  "path" TEXT NOT NULL,
  "metadata" JSONB,
  "completed" BOOLEAN DEFAULT FALSE,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PendingAction_userId_completed_idx" ON "PendingAction"("userId", "completed");
CREATE INDEX "PendingAction_priority_idx" ON "PendingAction"("priority");
CREATE INDEX "PendingAction_dueDate_idx" ON "PendingAction"("dueDate");

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "Agreement_userId_status_idx" ON "Agreement"("userId", "status");
CREATE INDEX IF NOT EXISTS "Agreement_createdAt_idx" ON "Agreement"("createdAt" DESC);

-- Add computed columns for user statistics (if supported by your DB)
-- These can be materialized views or computed in application layer

COMMENT ON TABLE "UserConnection" IS 'Tracks connections between users based on shared agreements';
COMMENT ON TABLE "ConnectionSuggestion" IS 'AI-generated suggestions for new connections';
COMMENT ON TABLE "NetworkAnalytics" IS 'Time-series analytics of user network health';
COMMENT ON TABLE "PartnerAnalytics" IS 'Detailed analytics for each partner relationship';
COMMENT ON TABLE "NavigationHistory" IS 'User navigation patterns for smart routing';
COMMENT ON TABLE "PendingAction" IS 'Pending actions requiring user attention';

