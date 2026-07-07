"use client";

import { useMemo, useState } from "react";
import type { Application } from "@prisma/client";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "@/lib/applications-utils";

type ApplicationsWorkspaceProps = {
  applications: Application[];
  initialTab?: ApplicationStatus;
};

export function ApplicationsWorkspace({ applications, initialTab = "APPLIED" }: ApplicationsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ApplicationStatus>(initialTab);

  const filtered = useMemo(
    () => applications.filter((application) => application.status === activeTab),
    [activeTab, applications]
  );

  return (
    <div className="workspace-body">
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
            {STATUS_LABELS[status]}
          </button>
        ))}
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
        <p className="empty-inline workspace-empty">No roles in {STATUS_LABELS[activeTab].toLowerCase()} yet.</p>
      )}
    </div>
  );
}
