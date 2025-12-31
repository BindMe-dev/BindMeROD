-- Align Agreement table with current Drizzle schema (effectiveDate/endDate/isPermanent)
ALTER TABLE "Agreement"
ADD COLUMN IF NOT EXISTS "effectiveDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "endDate" TEXT,
ADD COLUMN IF NOT EXISTS "isPermanent" BOOLEAN NOT NULL DEFAULT false;
