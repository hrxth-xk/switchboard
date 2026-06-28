import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationList } from "@/components/applications/ApplicationList";
import { requireUser } from "@/lib/auth";
import { sortByAppliedAtDesc, STATUS_LABELS, statusFromSlug } from "@/lib/applications-utils";
import { prisma } from "@/lib/db";

type ApplicationStatusPageProps = {
  params: Promise<{ status: string }>;
};

export default async function ApplicationStatusPage({ params }: ApplicationStatusPageProps) {
  const { status: statusSlug } = await params;
  const status = statusFromSlug(statusSlug);

  if (!status) {
    notFound();
  }

  const user = await requireUser();
  const applications = await prisma.application.findMany({
    where: { userId: user.id, status },
    orderBy: { company: "asc" }
  });

  const sorted = sortByAppliedAtDesc(applications);
  const label = STATUS_LABELS[status];

  return (
    <div className="workspace-page">
      <header className="page-header page-header-back">
        <Link className="back-link" href="/dashboard/applications">
          ← Applications
        </Link>
        <h1 className="page-title">{label}</h1>
        <p className="page-kicker">
          {sorted.length} {sorted.length === 1 ? "role" : "roles"}
        </p>
      </header>
      <ApplicationList applications={sorted} emptyText={`No roles in ${label.toLowerCase()} yet.`} />
    </div>
  );
}
