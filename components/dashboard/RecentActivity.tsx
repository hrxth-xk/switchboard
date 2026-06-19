import type { ActivityEntry } from "@/lib/dashboard-utils";
import { formatRelativeTime } from "@/lib/dashboard-utils";
import { EmptyState, Panel } from "@/components/dashboard/shared";

type RecentActivityProps = {
  entries: ActivityEntry[];
};

export function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <Panel title="Recent activity" kicker="Latest moves across your prep stack">
      {entries.length ? (
        <ul className="activity-list">
          {entries.map((entry) => (
            <li className="activity-item" key={entry.id}>
              <span className="activity-mark" aria-hidden="true">
                ✓
              </span>
              <div className="activity-copy">
                <p className="activity-label">{entry.label}</p>
                {entry.at ? <p className="activity-time">{formatRelativeTime(entry.at)}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState text="Activity will show up here as you add topics, applications, interviews, and notes." />
      )}
    </Panel>
  );
}
