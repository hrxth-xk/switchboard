import type { Application } from "@prisma/client";
import { EmptyState, Panel } from "@/components/dashboard/shared";

type ApplicationsPreviewProps = {
  applications: Application[];
};

export function ApplicationsPreview({ applications }: ApplicationsPreviewProps) {
  return (
    <Panel title="Applications" kicker="Top pipeline priorities">
      {applications.length ? (
        <div className="preview-list">
          <div className="preview-row preview-row-head" aria-hidden="true">
            <span>Company</span>
            <span>Status</span>
            <span>Next step</span>
          </div>
          {applications.map((application) => (
            <div className="preview-row" key={application.id}>
              <span className="preview-company">{application.company}</span>
              <span className="pill">{application.status}</span>
              <span className="preview-step">{application.nextStep ?? "No next step logged"}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Add companies you want to pursue." />
      )}
    </Panel>
  );
}
