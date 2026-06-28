import Link from "next/link";
import {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  STATUS_SLUGS,
  type ApplicationStatus
} from "@/lib/applications-utils";

type ApplicationStatusHubProps = {
  counts: Record<ApplicationStatus, number>;
};

export function ApplicationStatusHub({ counts }: ApplicationStatusHubProps) {
  const total = APPLICATION_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  if (!total) {
    return <p className="empty-inline">No applications yet. Add a role with Quick Add.</p>;
  }

  return (
    <div className="application-status-grid">
      {APPLICATION_STATUSES.map((status) => (
        <Link
          key={status}
          className="application-status-btn"
          href={`/dashboard/applications/${STATUS_SLUGS[status]}`}
        >
          <span className="application-status-label">{STATUS_LABELS[status]}</span>
          <span className="application-status-count">{counts[status]}</span>
        </Link>
      ))}
    </div>
  );
}
