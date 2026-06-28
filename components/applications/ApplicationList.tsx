"use client";

import { useState } from "react";
import type { Application } from "@prisma/client";
import { ApplicationEditor } from "@/components/applications/ApplicationEditor";
import { applicationNextAction } from "@/lib/applications-utils";
import { formatResumeUploadedAt } from "@/lib/resume-utils";

type ApplicationListProps = {
  applications: Application[];
  emptyText?: string;
};

export function ApplicationList({ applications, emptyText = "No roles in this stage." }: ApplicationListProps) {
  const [editing, setEditing] = useState<Application | null>(null);

  if (!applications.length) {
    return <p className="empty-inline">{emptyText}</p>;
  }

  return (
    <>
      <ul className="application-list">
        {applications.map((application) => (
          <ApplicationListItem
            application={application}
            key={application.id}
            onEdit={() => setEditing(application)}
          />
        ))}
      </ul>

      {editing ? <ApplicationEditor application={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function ApplicationListItem({
  application,
  onEdit
}: {
  application: Application;
  onEdit: () => void;
}) {
  const nextAction = application.nextAction ?? applicationNextAction(application);
  const resumeMeta = application.resumeFileName
    ? application.resumeUploadedAt
      ? `${application.resumeFileName} · uploaded ${formatResumeUploadedAt(application.resumeUploadedAt)}`
      : application.resumeFileName
    : null;

  return (
    <li>
      <button className="application-list-card" type="button" onClick={onEdit}>
        <div className="application-list-main">
          <p className="application-list-company">{application.company}</p>
          <p className="application-list-role">{application.role}</p>
        </div>
        <p className="application-list-action">{nextAction}</p>
        {resumeMeta ? <p className="application-list-resume">{resumeMeta}</p> : null}
      </button>
    </li>
  );
}
