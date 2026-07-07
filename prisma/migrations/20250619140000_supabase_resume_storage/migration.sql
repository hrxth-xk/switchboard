-- Rename resume path column to reflect Supabase Storage (not local/Vercel paths).
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "resumeStoragePath" TEXT;

UPDATE "Application"
SET "resumeStoragePath" = "resumeFilePath"
WHERE "resumeStoragePath" IS NULL
  AND "resumeFilePath" IS NOT NULL;

ALTER TABLE "Application" DROP COLUMN IF EXISTS "resumeFilePath";
