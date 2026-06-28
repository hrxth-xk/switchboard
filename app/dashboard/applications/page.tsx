import { ApplicationStatusHub } from "@/components/applications/ApplicationStatusHub";
import { requireUser } from "@/lib/auth";
import { getStatusCounts } from "@/lib/applications-utils";
import { prisma } from "@/lib/db";

export default async function ApplicationsPage() {
  const user = await requireUser();

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { company: "asc" }]
  });

  const counts = getStatusCounts(applications);

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Applications</h1>
        <p className="page-kicker">Pick a stage to view and update roles</p>
      </header>
      <ApplicationStatusHub counts={counts} />
    </div>
  );
}
