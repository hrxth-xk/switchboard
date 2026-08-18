"use client";

import { useMemo, useState } from "react";
import { Briefcase } from "lucide-react";
import type { Application } from "@prisma/client";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerList } from "@/components/ui/StaggerList";
import {
  APPLICATION_STATUSES,
  getStatusCounts,
  sortByAppliedAtDesc,
  STATUS_LABELS,
  type ApplicationStatus
} from "@/lib/applications-utils";

type ResumeApplicationsProps = {
  applications: Application[];
};

type Filter = ApplicationStatus | "ALL";

export function ResumeApplications({ applications }: ResumeApplicationsProps) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const counts = useMemo(() => getStatusCounts(applications), [applications]);
  const sorted = useMemo(() => sortByAppliedAtDesc(applications), [applications]);
  const visible = filter === "ALL" ? sorted : sorted.filter((application) => application.status === filter);

  // Only offer stages this resume actually reached, so the row stays short.
  const usedStatuses = APPLICATION_STATUSES.filter((status) => counts[status] > 0);

  return (
    <section className="resume-applications">
      <p className="detail-notes-label">Applications sent with this resume</p>

      {applications.length === 0 ? (
        <EmptyState
          description="Attach this version when you add an application and it will show up here."
          icon={Briefcase}
          title="No applications use this resume yet"
        />
      ) : (
        <>
          <div className="segmented-control segmented-control-wrap" role="tablist" aria-label="Filter by stage">
            <button
              aria-selected={filter === "ALL"}
              className={`segmented-btn${filter === "ALL" ? " active" : ""}`}
              onClick={() => setFilter("ALL")}
              role="tab"
              type="button"
            >
              <span className="segmented-btn-label">All</span>
              <span className="segmented-btn-count">({applications.length})</span>
            </button>
            {usedStatuses.map((status) => (
              <button
                aria-selected={filter === status}
                className={`segmented-btn${filter === status ? " active" : ""}`}
                key={status}
                onClick={() => setFilter(status)}
                role="tab"
                type="button"
              >
                <span className="segmented-btn-label">{STATUS_LABELS[status]}</span>
                <span className="segmented-btn-count">({counts[status]})</span>
              </button>
            ))}
          </div>

          {visible.length ? (
            <StaggerList
              className="entity-card-list"
              getKey={(application) => application.id}
              items={visible}
              renderItem={(application) => <ApplicationCard application={application} />}
            />
          ) : (
            <p className="empty-inline workspace-empty">
              {`No ${STATUS_LABELS[filter as ApplicationStatus].toLowerCase()} applications for this resume.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
