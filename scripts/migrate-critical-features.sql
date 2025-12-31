-- Migration: Add Critical Features
-- Date: 2025-12-30
-- Description: Add payment, subscription, and authentication fields

-- 1. Add payment tracking to LawFirmAssignment
ALTER TABLE "LawFirmAssignment" 
ADD COLUMN IF NOT EXISTS "paymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP;

-- 2. Add subscription and billing to LawFirm
ALTER TABLE "LawFirm"
ADD COLUMN IF NOT EXISTS "passwordHash" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS "LawFirmAssignment_paymentStatus_idx" 
ON "LawFirmAssignment"("paymentStatus");

CREATE INDEX IF NOT EXISTS "LawFirm_subscriptionStatus_idx" 
ON "LawFirm"("subscriptionStatus");

CREATE INDEX IF NOT EXISTS "LawFirm_email_idx" 
ON "LawFirm"("email");

-- 4. Add comments for documentation
COMMENT ON COLUMN "LawFirmAssignment"."paymentIntentId" IS 'Stripe payment intent ID';
COMMENT ON COLUMN "LawFirmAssignment"."paymentStatus" IS 'Payment status: unpaid, pending, paid, failed, refunded';
COMMENT ON COLUMN "LawFirm"."passwordHash" IS 'Hashed password for firm portal login';
COMMENT ON COLUMN "LawFirm"."subscriptionTier" IS 'Subscription tier: basic, premium, enterprise';
COMMENT ON COLUMN "LawFirm"."subscriptionStatus" IS 'Subscription status: active, past_due, canceled, trialing';

-- 5. Update existing records
UPDATE "LawFirmAssignment" 
SET "paymentStatus" = 'unpaid' 
WHERE "paymentStatus" IS NULL;

UPDATE "LawFirm" 
SET "subscriptionTier" = 'basic',
    "subscriptionStatus" = 'active'
WHERE "subscriptionTier" IS NULL;

-- Success message
SELECT 'Migration completed successfully!' as message;

