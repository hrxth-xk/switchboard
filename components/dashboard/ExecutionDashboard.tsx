import type { ExecutionDashboardData } from "@/lib/execution-utils";
import { SnapshotGrid } from "@/components/dashboard/command/SnapshotGrid";
import { TodaysFocusSection } from "@/components/dashboard/command/TodaysFocusSection";

export function ExecutionDashboard({ data }: { data: ExecutionDashboardData }) {
  return (
    <div className="command-page">
      <TodaysFocusSection items={data.focus} />
      <SnapshotGrid applications={data.applications} dsa={data.dsa} projects={data.projects} />
    </div>
  );
}
