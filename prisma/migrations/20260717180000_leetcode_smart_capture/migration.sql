-- Smart DSA Capture: LeetCode metadata + unknown confidence for history imports.
ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Problem" ADD COLUMN IF NOT EXISTS "difficulty" TEXT;

ALTER TABLE "Problem" ALTER COLUMN "confidence" DROP NOT NULL;
ALTER TABLE "Problem" ALTER COLUMN "confidence" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "Problem_userId_slug_idx" ON "Problem"("userId", "slug");
