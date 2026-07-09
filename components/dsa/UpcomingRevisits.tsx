import Link from "next/link";
import { formatReviewDueLabel, type ProblemRow } from "@/lib/problem-utils";

type UpcomingRevisitsProps = {
  problems: ProblemRow[];
};

export function UpcomingRevisits({ problems }: UpcomingRevisitsProps) {
  return (
    <section className="workspace-section">
      <header className="workspace-section-header">
        <h2 className="workspace-section-title">Upcoming Revisits</h2>
      </header>

      {problems.length ? (
        <ul className="revisit-cards">
          {problems.map((problem) => (
            <li key={problem.id}>
              <Link className="revisit-card" href={`/dashboard/dsa/${problem.id}`} prefetch={false}>
                <span className="revisit-card-date">
                  {problem.nextReview ? formatReviewDueLabel(problem.nextReview) : "—"}
                </span>
                <span className="revisit-card-name">{problem.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline workspace-empty">No upcoming revisits scheduled.</p>
      )}
    </section>
  );
}
