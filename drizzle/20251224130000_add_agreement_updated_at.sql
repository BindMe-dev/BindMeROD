-- Add missing updatedAt column to Agreement table to match application schema
ALTER TABLE "Agreement"
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP NOT NULL DEFAULT now();

-- Backfill existing rows to a sane timestamp (if default did not apply)
UPDATE "Agreement"
SET "updatedAt" = COALESCE("updatedAt", now());
