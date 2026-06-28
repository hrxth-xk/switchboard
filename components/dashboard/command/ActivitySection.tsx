import type { ActivityItem } from "@/lib/activity-utils";

export function ActivitySection({ items }: { items: ActivityItem[] }) {
  return (
    <section className="section-block">
      <header className="section-header">
        <h2 className="section-title">Recent activity</h2>
      </header>

      {items.length ? (
        <ul className="activity-feed">
          {items.map((item) => (
            <li className="activity-feed-item" key={item.id}>
              <span className="activity-feed-label">{item.label}</span>
              <span className="activity-feed-time">{item.time}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline">Activity appears as you log problems, move applications, and update projects.</p>
      )}
    </section>
  );
}
