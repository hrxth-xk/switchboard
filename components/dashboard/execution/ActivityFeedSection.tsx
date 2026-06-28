import type { ActivityItem } from "@/lib/activity-utils";
import { ExecSection } from "@/components/dashboard/execution/shared";

export function ActivityFeedSection({ items }: { items: ActivityItem[] }) {
  return (
    <ExecSection title="Recent activity" kicker="Latest moves across your stack">
      {items.length ? (
        <ul className="activity-list">
          {items.map((item) => (
            <li className="activity-item" key={item.id}>
              <span className="activity-mark" aria-hidden="true">
                ✓
              </span>
              <div className="activity-copy">
                <p className="activity-label">{item.label}</p>
                <p className="activity-time">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="item-meta">Activity will appear here as you log problems, move applications, and update projects.</p>
      )}
    </ExecSection>
  );
}
