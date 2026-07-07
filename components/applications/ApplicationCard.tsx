"use client";

import Link from "next/link";
import type { Application } from "@prisma/client";
import { STATUS_LABELS, applicationStatusTone } from "@/lib/applications-utils";
import { formatShortDate } from "@/lib/problem-utils";

type ApplicationCardProps = {
  application: Application;
};

export function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <Link className="entity-card application-entity-card" href={`/dashboard/applications/detail/${application.id}`}>
      <div className="entity-card-top">
        <div className="application-card-brand">
          <span aria-hidden="true" className="application-card-logo">
            {application.company.slice(0, 1).toUpperCase()}
          </span>
          <div className="application-card-copy">
            <p className="entity-card-title">{application.company}</p>
            <p className="application-card-role">{application.role}</p>
          </div>
        </div>
        <span className={`entity-card-badge tone-${applicationStatusTone(application.status)}`}>
          {STATUS_LABELS[application.status as keyof typeof STATUS_LABELS]}
        </span>
      </div>
      <div className="application-card-meta">
        <p className="application-card-meta-line">
          {application.jobId ? `Job ID ${application.jobId}` : "No job ID"}
        </p>
        <p className="application-card-meta-line">
          {application.appliedAt ? `Applied ${formatShortDate(application.appliedAt)}` : "Not applied yet"}
        </p>
      </div>
    </Link>
  );
}
