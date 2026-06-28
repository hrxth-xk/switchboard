import type { Application } from "@prisma/client";
import { EmptyState, Panel } from "@/components/dashboard/shared";
import { applicationNextAction } from "@/lib/applications-utils";

type UpcomingActionsProps = {
  applications: Application[];
};

export function UpcomingActions({ applications }: UpcomingActionsProps) {
  return (
    <Panel title="Next actions" kicker="What to do on active applications">
      {applications.length ? (
        <ul className="action-list">
          {applications.map((application) => (
            <li className="action-item" key={application.id}>
              <div>
                <p className="item-title">{application.company}</p>
                <p className="item-meta">{application.role}</p>
              </div>
              <p className="action-copy">{applicationNextAction(application)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="No active next actions. Add applications or set a next action." />
      )}
    </Panel>
  );
}
