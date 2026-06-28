import type { QueueItem } from "@/lib/todays-queue";
import { ExecSection } from "@/components/dashboard/execution/shared";

export function TodaysQueueSection({ items }: { items: QueueItem[] }) {
  return (
    <ExecSection title="Today's queue" kicker="Everything that needs action today">
      {items.length ? (
        <ul className="queue-list">
          {items.map((item) => (
            <li className="queue-item" key={item.id}>
              <span className="queue-kind">{item.kind}</span>
              <div className="queue-copy">
                <p className="queue-action">{item.action}</p>
                <p className="queue-source">{item.source}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="item-meta">Your queue is empty. Use Quick Add to log a problem, application, or project.</p>
      )}
    </ExecSection>
  );
}
