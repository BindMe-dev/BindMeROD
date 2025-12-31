-- Add individual name fields and date of birth to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "middleName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" TEXT;

-- For existing users, split the name field (this is a one-time migration)
-- You may need to handle this manually for existing data