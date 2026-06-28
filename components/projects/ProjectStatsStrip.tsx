import { Panel } from "@/components/dashboard/shared";
import type { ProjectStats } from "@/lib/projects-utils";

export function ProjectStatsStrip({ active, paused, completed }: ProjectStats) {
  return (
    <Panel title="Projects" kicker="Work containers for portfolio and interview stories">
      <div className="stats-strip">
        <div className="stats-strip-item">
          <span className="stats-strip-value">{active}</span>
          <span className="stats-strip-label">Active</span>
        </div>
        <div className="stats-strip-item">
          <span className="stats-strip-value">{paused}</span>
          <span className="stats-strip-label">Paused</span>
        </div>
        <div className="stats-strip-item">
          <span className="stats-strip-value">{completed}</span>
          <span className="stats-strip-label">Completed</span>
        </div>
      </div>
    </Panel>
  );
}
