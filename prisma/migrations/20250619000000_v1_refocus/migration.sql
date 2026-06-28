-- Switchboard V1 refocus: problem-centric DSA, simplified applications/projects, remove goals/interviews/topics

DROP TABLE IF EXISTS "Goal" CASCADE;
DROP TABLE IF EXISTS "Interview" CASCADE;
DROP TABLE IF EXISTS "Topic" CASCADE;

CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "topic" TEXT NOT NULL,
    "pattern" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "lastPracticed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReview" TIMESTAMP(3),
    "revisitCount" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Problem_userId_name_key" ON "Problem"("userId", "name");
CREATE INDEX "Problem_userId_nextReview_idx" ON "Problem"("userId", "nextReview");
CREATE INDEX "Problem_userId_topic_idx" ON "Problem"("userId", "topic");

ALTER TABLE "Problem" ADD CONSTRAINT "Problem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Application: rename columns and add new fields
ALTER TABLE "Application" RENAME COLUMN "roleTitle" TO "role";
ALTER TABLE "Application" RENAME COLUMN "nextStep" TO "nextAction";
ALTER TABLE "Application" DROP COLUMN IF EXISTS "source";
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "jobId" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "jobUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "resumeUsed" TEXT;

UPDATE "Application" SET "status" = 'INTERVIEW' WHERE "status" = 'INTERVIEWING';

CREATE UNIQUE INDEX IF NOT EXISTS "Application_userId_company_role_key" ON "Application"("userId", "company", "role");

-- Project: simplify fields
ALTER TABLE "Project" RENAME COLUMN "nextAction" TO "nextStep";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "description";
ALTER TABLE "Project" DROP COLUMN IF EXISTS "priority";
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "notes" TEXT;
