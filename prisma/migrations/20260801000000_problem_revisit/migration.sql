-- Revisit history, so "Undo Last Revisit" survives a reload instead of living
-- only in the toast. Existing problems have no rows: undo becomes available
-- from their next revisit onwards.
CREATE TABLE IF NOT EXISTS "ProblemRevisit" (
  "id" TEXT NOT NULL,
  "problemId" TEXT NOT NULL,
  "reviewedAt" TIMESTAMP(3) NOT NULL,
  "prevLastPracticed" TIMESTAMP(3) NOT NULL,
  "prevNextReview" TIMESTAMP(3),
  "prevRevisitCount" INTEGER NOT NULL,
  "prevConfidence" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProblemRevisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProblemRevisit_problemId_reviewedAt_idx" ON "ProblemRevisit"("problemId", "reviewedAt");

ALTER TABLE "ProblemRevisit"
  ADD CONSTRAINT "ProblemRevisit_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
