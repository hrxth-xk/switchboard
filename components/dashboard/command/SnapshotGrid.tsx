import type { ApplicationSnapshot, DsaSnapshot, ProjectSnapshot } from "@/lib/command-center";

type SnapshotGridProps = {
  dsa: DsaSnapshot;
  applications: ApplicationSnapshot;
  projects: ProjectSnapshot;
};

export function SnapshotGrid({ dsa, applications, projects }: SnapshotGridProps) {
  return (
    <div className="snapshot-grid">
      <article className="snapshot-card">
        <p className="snapshot-label">DSA</p>
        <ul className="snapshot-lines">
          <li>
            <span>{dsa.total}</span> problems tracked
          </li>
          <li>
            <span>{dsa.reviewDue}</span> due for review
          </li>
          <li>
            Confidence <span>{dsa.avgConfidence || "—"}</span>
          </li>
        </ul>
      </article>

      <article className="snapshot-card">
        <p className="snapshot-label">Applications</p>
        <ul className="snapshot-lines">
          <li>
            <span>{applications.wishlist}</span> wishlist
          </li>
          <li>
            <span>{applications.applied}</span> applied
          </li>
          <li>
            <span>{applications.interviewing}</span> interviewing
          </li>
        </ul>
      </article>

      <article className="snapshot-card">
        <p className="snapshot-label">Projects</p>
        <ul className="snapshot-lines">
          <li>
            <span>{projects.active}</span> active
          </li>
          <li>
            <span>{projects.paused}</span> paused
          </li>
          <li>
            <span>{projects.completed}</span> completed
          </li>
        </ul>
      </article>
    </div>
  );
}
