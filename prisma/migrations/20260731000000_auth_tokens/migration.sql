-- Emailed one-time tokens (password reset) and the session-revocation marker
-- stamped when a password changes.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- Email confirmation was tried and rolled back; drop its column if it exists.
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerifiedAt";

CREATE TABLE IF NOT EXISTS "AuthToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_tokenHash_key" ON "AuthToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuthToken_userId_purpose_idx" ON "AuthToken"("userId", "purpose");

ALTER TABLE "AuthToken"
  ADD CONSTRAINT "AuthToken_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry over outstanding links from the reset-only table this replaces, so any
-- reset email already sitting in an inbox keeps working.
DO $$
BEGIN
  IF to_regclass('"PasswordResetToken"') IS NOT NULL THEN
    INSERT INTO "AuthToken" ("id", "userId", "purpose", "tokenHash", "expiresAt", "usedAt", "createdAt")
    SELECT "id", "userId", 'PASSWORD_RESET', "tokenHash", "expiresAt", "usedAt", "createdAt"
    FROM "PasswordResetToken"
    ON CONFLICT ("tokenHash") DO NOTHING;
  END IF;
END $$;

DROP TABLE IF EXISTS "PasswordResetToken";
