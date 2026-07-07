import { ApplicationsWorkspace } from "@/components/applications/ApplicationsWorkspace";
import { requireUser } from "@/lib/auth";
import { statusFromSlug } from "@/lib/applications-utils";
import { prisma } from "@/lib/db";

type ApplicationsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const user = await requireUser();
  const { tab } = await searchParams;

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: [{ status: "asc" }, { company: "asc" }]
  });

  const initialTab = tab ? statusFromSlug(tab) ?? "APPLIED" : "APPLIED";

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Applications</h1>
        <p className="page-kicker">Where you are in your job search</p>
      </header>
      <ApplicationsWorkspace applications={applications} initialTab={initialTab} />
    </div>
  );
}
