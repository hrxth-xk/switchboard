CREATE TABLE IF NOT EXISTS "UserGoals" (
  "userId" TEXT NOT NULL,
  "dailyDsaGoal" INTEGER NOT NULL DEFAULT 3,
  "dailyApplicationsGoal" INTEGER NOT NULL DEFAULT 2,
  "dailyProjectSessionsGoal" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserGoals_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserGoals"
  ADD CONSTRAINT "UserGoals_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
