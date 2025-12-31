-- Add ipAddress to User to capture signup IP
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
