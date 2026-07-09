-- Drop legacy company+role unique constraint; uniqueness is company+role+jobId
DROP INDEX IF EXISTS "Application_userId_company_role_key";

CREATE UNIQUE INDEX "Application_userId_company_role_jobId_key"
  ON "Application"("userId", "company", "role", "jobId");
