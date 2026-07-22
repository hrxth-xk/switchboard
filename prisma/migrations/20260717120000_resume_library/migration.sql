-- Resume Library: ResumeVersion + Application.resumeVersionId
-- Migrates existing per-application resume files into the library without moving storage objects.

CREATE TABLE IF NOT EXISTS "ResumeVersion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "storagePath" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResumeVersion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ResumeVersion_userId_archived_idx" ON "ResumeVersion"("userId", "archived");
CREATE INDEX IF NOT EXISTS "ResumeVersion_userId_name_idx" ON "ResumeVersion"("userId", "name");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ResumeVersion_userId_fkey'
  ) THEN
    ALTER TABLE "ResumeVersion"
      ADD CONSTRAINT "ResumeVersion_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "resumeVersionId" TEXT;

-- Promote existing application resumes into the library (one ResumeVersion per stored file).
INSERT INTO "ResumeVersion" (
  "id",
  "userId",
  "name",
  "version",
  "storagePath",
  "originalFileName",
  "archived",
  "createdAt",
  "updatedAt"
)
SELECT
  'migrated_' || a."id",
  a."userId",
  COALESCE(NULLIF(TRIM(BOTH FROM regexp_replace(a."resumeFileName", '\.[^.]+$', '', 'i')), ''), 'Resume'),
  1,
  a."resumeStoragePath",
  COALESCE(a."resumeFileName", 'resume.pdf'),
  false,
  COALESCE(a."resumeUploadedAt", a."createdAt"),
  COALESCE(a."resumeUploadedAt", a."updatedAt")
FROM "Application" a
WHERE a."resumeStoragePath" IS NOT NULL
  AND a."resumeStoragePath" <> ''
  AND NOT EXISTS (
    SELECT 1 FROM "ResumeVersion" rv WHERE rv."id" = 'migrated_' || a."id"
  );

UPDATE "Application" a
SET "resumeVersionId" = 'migrated_' || a."id"
WHERE a."resumeStoragePath" IS NOT NULL
  AND a."resumeStoragePath" <> ''
  AND a."resumeVersionId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "ResumeVersion" rv WHERE rv."id" = 'migrated_' || a."id"
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Application_resumeVersionId_fkey'
  ) THEN
    ALTER TABLE "Application"
      ADD CONSTRAINT "Application_resumeVersionId_fkey"
      FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Application_resumeVersionId_idx" ON "Application"("resumeVersionId");

ALTER TABLE "Application" DROP COLUMN IF EXISTS "resumeFileName";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "resumeStoragePath";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "resumeFileSize";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "resumeUploadedAt";
