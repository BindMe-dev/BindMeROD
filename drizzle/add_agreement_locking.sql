-- Add agreement locking and amendment workflow fields
-- Migration: add_agreement_locking
-- Created: 2025-12-30

ALTER TABLE "Agreement" 
ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "lockedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lockedBy" TEXT,
ADD COLUMN IF NOT EXISTS "amendmentRequestedBy" TEXT,
ADD COLUMN IF NOT EXISTS "amendmentRequestedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "amendmentReason" TEXT,
ADD COLUMN IF NOT EXISTS "amendmentProposedChanges" JSONB,
ADD COLUMN IF NOT EXISTS "amendmentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "amendmentRespondedBy" TEXT,
ADD COLUMN IF NOT EXISTS "amendmentRespondedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "amendmentResponse" TEXT;

-- Lock all agreements that are already sent for signature
UPDATE "Agreement" 
SET "isLocked" = true, 
    "lockedAt" = "sentForSignatureAt",
    "lockedBy" = "sentForSignatureBy"
WHERE "status" IN ('pending_signature', 'active', 'completed') 
  AND "sentForSignatureAt" IS NOT NULL
  AND "isLocked" IS NOT true;

-- Add comment for documentation
COMMENT ON COLUMN "Agreement"."isLocked" IS 'Agreement is locked and cannot be edited without amendment approval';
COMMENT ON COLUMN "Agreement"."amendmentStatus" IS 'Status of amendment request: pending, approved, rejected';

