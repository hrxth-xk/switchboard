import { Panel } from "@/components/dashboard/shared";
import type { ApplicationStats } from "@/lib/applications-utils";

export function ApplicationStatsStrip({ wishlist, active, offers }: ApplicationStats) {
  return (
    <Panel title="Applications" kicker="Track every role from wishlist to outcome">
      <div className="stats-strip">
        <div className="stats-strip-item">
          <span className="stats-strip-value">{wishlist}</span>
          <span className="stats-strip-label">Wishlist</span>
        </div>
        <div className="stats-strip-item">
          <span className="stats-strip-value">{active}</span>
          <span className="stats-strip-label">In progress</span>
        </div>
        <div className="stats-strip-item">
          <span className="stats-strip-value">{offers}</span>
          <span className="stats-strip-label">Offers</span>
        </div>
      </div>
    </Panel>
  );
}
