"use client";

import { useMemo, useState } from "react";
import type { Application } from "@prisma/client";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import {
  APPLICATION_STATUSES,
  getStatusCounts,
  STATUS_LABELS,
  type ApplicationStatus
} from "@/lib/applications-utils";

type ApplicationsWorkspaceProps = {
  applications: Application[];
  initialTab?: ApplicationStatus;
};

export function ApplicationsWorkspace({ applications, initialTab = "APPLIED" }: ApplicationsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ApplicationStatus>(initialTab);
  const [query, setQuery] = useState("");
  const counts = useMemo(() => getStatusCounts(applications), [applications]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return applications
      .filter((application) => {
        if (application.status !== activeTab) return false;
        if (!value) return true;

        return (
          application.company.toLowerCase().includes(value) ||
          application.role.toLowerCase().includes(value) ||
          (application.location?.toLowerCase().includes(value) ?? false) ||
          (application.jobId?.toLowerCase().includes(value) ?? false) ||
          (application.nextAction?.toLowerCase().includes(value) ?? false) ||
          (application.notes?.toLowerCase().includes(value) ?? false)
        );
      })
      .sort((left, right) => {
        const leftCreated = new Date(left.createdAt).getTime();
        const rightCreated = new Date(right.createdAt).getTime();
        if (rightCreated !== leftCreated) return rightCreated - leftCreated;
        return right.id.localeCompare(left.id);
      });
  }, [activeTab, applications, query]);

  return (
    <div className="workspace-body">
      <div className="applications-workspace-toolbar">
        <div className="segmented-control segmented-control-wrap" role="tablist" aria-label="Application stage">
          {APPLICATION_STATUSES.map((status) => (
            <button
              className={`segmented-btn${activeTab === status ? " active" : ""}`}
              key={status}
              onClick={() => setActiveTab(status)}
              role="tab"
              type="button"
              aria-selected={activeTab === status}
            >
              <span className="segmented-btn-label">{STATUS_LABELS[status]}</span>
              <span className="segmented-btn-count">({counts[status]})</span>
            </button>
          ))}
        </div>

        <input
          aria-label={`Search ${STATUS_LABELS[activeTab].toLowerCase()} applications`}
          className="table-search workspace-search applications-workspace-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${STATUS_LABELS[activeTab].toLowerCase()}…`}
          type="search"
          value={query}
        />
      </div>

      {filtered.length ? (
        <ul className="entity-card-list">
          {filtered.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline workspace-empty">
          {query.trim()
            ? `No ${STATUS_LABELS[activeTab].toLowerCase()} matches for “${query.trim()}”.`
            : `No roles in ${STATUS_LABELS[activeTab].toLowerCase()} yet.`}
        </p>
      )}
    </div>
  );
}
