-- Step 1: Delete duplicate memberships, keeping only the oldest one per user (by createdAt)
-- This handles cases where a user has multiple memberships
DELETE FROM "Membership" m1
WHERE EXISTS (
  SELECT 1 
  FROM "Membership" m2 
  WHERE m2."userId" = m1."userId" 
    AND (
      m2."createdAt" < m1."createdAt"
      OR (m2."createdAt" = m1."createdAt" AND m2.id < m1.id)
    )
);

-- Step 2: Drop the old composite unique constraint if it exists
ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "Membership_userId_orgId_key";

-- Step 3: Add the new unique constraint on userId only (enforces one org per user)
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_key" UNIQUE ("userId");

