import type { DsaTodayProgress } from "@/lib/problem-utils";

type DsaTodayProgressProps = {
  progress: DsaTodayProgress;
};

export function DsaTodayProgressSection({ progress }: DsaTodayProgressProps) {
  return (
    <section className="workspace-section">
      <header className="workspace-section-header">
        <h2 className="workspace-section-title">Today&apos;s Progress</h2>
      </header>

      <div className="progress-pair-grid">
        <div className="progress-pair-card">
          <p className="progress-pair-label">Problems solved</p>
          <p className="progress-pair-value">
            {progress.solvedToday} / {progress.solvedGoal}
          </p>
        </div>
        <div className="progress-pair-card">
          <p className="progress-pair-label">Revisits</p>
          <p className="progress-pair-value">
            {progress.revisitsDueToday === 0
              ? "None due"
              : `${progress.revisitsCompletedToday} / ${progress.revisitsDueToday}`}
          </p>
        </div>
      </div>
    </section>
  );
}
