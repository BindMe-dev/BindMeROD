-- Enhanced Law Firm Features Migration
-- 
-- WHY: Extend existing law firm schema to support marketplace features,
-- service listings, reviews, and revenue tracking
--
-- BUSINESS VALUE:
-- - Enable law firm marketplace for users
-- - Track revenue and commissions
-- - Build trust through reviews and ratings
-- - Support multiple service packages per firm

-- Add new columns to existing LawFirm table
ALTER TABLE "LawFirm" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "logo" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "postcode" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'UK',
ADD COLUMN IF NOT EXISTS "verified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "totalCases" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "activeCases" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "completedCases" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "successRate" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "avgResponseTimeHours" DECIMAL(5,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "totalRevenue" DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "platformCommission" DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "userRating" DECIMAL(3,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0;

-- Law Firm Services (packages they offer)
CREATE TABLE IF NOT EXISTS "LawFirmService" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "LawFirm"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- 'consultation', 'mediation', 'litigation', 'document_review'
  "price" DECIMAL(10,2) NOT NULL,
  "currency" TEXT DEFAULT 'GBP',
  "duration" TEXT, -- e.g., '1 hour', '2-3 weeks'
  "active" BOOLEAN DEFAULT true,
  "featured" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LawFirmService_firmId_idx" ON "LawFirmService"("firmId");
CREATE INDEX IF NOT EXISTS "LawFirmService_active_idx" ON "LawFirmService"("active");

-- Law Firm Reviews (user feedback)
CREATE TABLE IF NOT EXISTS "LawFirmReview" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "LawFirm"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "agreementId" TEXT REFERENCES "Agreement"("id") ON DELETE SET NULL,
  "rating" INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  "title" TEXT,
  "comment" TEXT,
  "responseTime" INTEGER, -- hours
  "professionalism" INTEGER CHECK (professionalism >= 1 AND professionalism <= 5),
  "communication" INTEGER CHECK (communication >= 1 AND communication <= 5),
  "valueForMoney" INTEGER CHECK (valueForMoney >= 1 AND valueForMoney <= 5),
  "wouldRecommend" BOOLEAN,
  "verified" BOOLEAN DEFAULT false, -- verified purchase
  "helpful" INTEGER DEFAULT 0, -- upvotes
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LawFirmReview_firmId_idx" ON "LawFirmReview"("firmId");
CREATE INDEX IF NOT EXISTS "LawFirmReview_userId_idx" ON "LawFirmReview"("userId");
CREATE INDEX IF NOT EXISTS "LawFirmReview_rating_idx" ON "LawFirmReview"("rating");

-- Law Firm Case Assignments (enhanced version of existing LawFirmAssignment)
-- Add new columns to track case lifecycle
ALTER TABLE "LawFirmAssignment"
ADD COLUMN IF NOT EXISTS "serviceId" TEXT REFERENCES "LawFirmService"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending', -- pending, accepted, in_progress, resolved, declined
ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'medium', -- low, medium, high, urgent
ADD COLUMN IF NOT EXISTS "assignedBy" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "declineReason" TEXT,
ADD COLUMN IF NOT EXISTS "outcome" TEXT, -- 'settled', 'won', 'lost', 'withdrawn'
ADD COLUMN IF NOT EXISTS "agreedFee" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "actualFee" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "platformCommissionRate" DECIMAL(5,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS "platformCommissionAmount" DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "LawFirmAssignment_status_idx" ON "LawFirmAssignment"("status");
CREATE INDEX IF NOT EXISTS "LawFirmAssignment_priority_idx" ON "LawFirmAssignment"("priority");

-- Law Firm Revenue Tracking
CREATE TABLE IF NOT EXISTS "LawFirmRevenue" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "LawFirm"("id") ON DELETE CASCADE,
  "assignmentId" TEXT NOT NULL REFERENCES "LawFirmAssignment"("id") ON DELETE CASCADE,
  "agreementId" TEXT NOT NULL REFERENCES "Agreement"("id") ON DELETE CASCADE,
  "serviceId" TEXT REFERENCES "LawFirmService"("id") ON DELETE SET NULL,
  "totalFee" DECIMAL(10,2) NOT NULL,
  "platformCommissionRate" DECIMAL(5,2) NOT NULL,
  "platformCommissionAmount" DECIMAL(10,2) NOT NULL,
  "firmPayout" DECIMAL(10,2) NOT NULL,
  "currency" TEXT DEFAULT 'GBP',
  "status" TEXT DEFAULT 'pending', -- pending, paid, disputed
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LawFirmRevenue_firmId_idx" ON "LawFirmRevenue"("firmId");
CREATE INDEX IF NOT EXISTS "LawFirmRevenue_status_idx" ON "LawFirmRevenue"("status");
CREATE INDEX IF NOT EXISTS "LawFirmRevenue_createdAt_idx" ON "LawFirmRevenue"("createdAt");

-- Law Firm Analytics (time-series performance data)
CREATE TABLE IF NOT EXISTS "LawFirmAnalytics" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "LawFirm"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "newCases" INTEGER DEFAULT 0,
  "closedCases" INTEGER DEFAULT 0,
  "activeCases" INTEGER DEFAULT 0,
  "avgResponseTimeHours" DECIMAL(5,2),
  "successRate" DECIMAL(5,2),
  "revenue" DECIMAL(10,2) DEFAULT 0.00,
  "platformCommission" DECIMAL(10,2) DEFAULT 0.00,
  "avgRating" DECIMAL(3,2),
  "newReviews" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LawFirmAnalytics_firmId_date_idx" ON "LawFirmAnalytics"("firmId", "date");
CREATE UNIQUE INDEX IF NOT EXISTS "LawFirmAnalytics_unique_firm_date" ON "LawFirmAnalytics"("firmId", "date");

-- Law Firm Consultation Requests (before formal engagement)
CREATE TABLE IF NOT EXISTS "LawFirmConsultation" (
  "id" TEXT PRIMARY KEY,
  "firmId" TEXT NOT NULL REFERENCES "LawFirm"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "agreementId" TEXT REFERENCES "Agreement"("id") ON DELETE SET NULL,
  "serviceId" TEXT REFERENCES "LawFirmService"("id") ON DELETE SET NULL,
  "status" TEXT DEFAULT 'pending', -- pending, scheduled, completed, declined
  "message" TEXT,
  "preferredDate" TIMESTAMP,
  "scheduledDate" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "declinedAt" TIMESTAMP,
  "declineReason" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "LawFirmConsultation_firmId_idx" ON "LawFirmConsultation"("firmId");
CREATE INDEX IF NOT EXISTS "LawFirmConsultation_userId_idx" ON "LawFirmConsultation"("userId");
CREATE INDEX IF NOT EXISTS "LawFirmConsultation_status_idx" ON "LawFirmConsultation"("status");

-- Comments for documentation
COMMENT ON TABLE "LawFirmService" IS 'Service packages offered by law firms (e.g., consultation, mediation, litigation)';
COMMENT ON TABLE "LawFirmReview" IS 'User reviews and ratings for law firms';
COMMENT ON TABLE "LawFirmRevenue" IS 'Revenue tracking and commission calculations';
COMMENT ON TABLE "LawFirmAnalytics" IS 'Daily performance metrics for law firms';
COMMENT ON TABLE "LawFirmConsultation" IS 'Initial consultation requests before formal engagement';

