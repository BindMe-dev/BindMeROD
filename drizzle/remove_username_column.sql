-- Remove username column and its unique index from User table
-- This migration removes the username field as email is now the key identifier

-- Drop the unique index first
DROP INDEX IF EXISTS "User_username_key";

-- Drop the username column
ALTER TABLE "User" DROP COLUMN IF EXISTS "username";

