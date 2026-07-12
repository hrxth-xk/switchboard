"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatReviewDueLabel, type ProblemRow } from "@/lib/problem-utils";

export type ReviewsDueGroup = {
  key: "overdue" | "today" | "tomorrow" | "later" | string;
  label: string;
  problems: ProblemRow[];
};

type ReviewsDueProps = {
  groups: ReviewsDueGroup[];
};

type ReviewEntry = {
  problem: ProblemRow;
  urgency: "overdue" | "today" | "tomorrow" | "later";
  dateLabel: string;
};

function urgencyFromGroupKey(key: string): ReviewEntry["urgency"] {
  if (key === "overdue" || key === "today" || key === "tomorrow" || key === "later") {
    return key;
  }
  return "later";
}

export function ReviewsDue({ groups }: ReviewsDueProps) {
  const [open, setOpen] = useState(false);

  const { dueCount, entries } = useMemo(() => {
    const next: ReviewEntry[] = [];
    let due = 0;

    for (const group of groups) {
      const urgency = urgencyFromGroupKey(group.key);
      for (const problem of group.problems) {
        if (urgency === "overdue" || urgency === "today") due += 1;
        next.push({
          problem,
          urgency,
          dateLabel: problem.nextReview ? formatReviewDueLabel(problem.nextReview) : group.label
        });
      }
    }

    return { dueCount: due, entries: next };
  }, [groups]);

  const hasScheduled = entries.length > 0;

  return (
    <section className="workspace-section reviews-due-section">
      <button
        aria-expanded={open}
        className={`reviews-due-trigger${open ? " is-open" : ""}${dueCount > 0 ? " has-due" : ""}`}
        disabled={!hasScheduled}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="reviews-due-trigger-copy">
          <span className="reviews-due-trigger-title">Reviews Due</span>
          <span className="reviews-due-trigger-hint">
            {dueCount === 0
              ? hasScheduled
                ? "Nothing due today"
                : "No reviews scheduled"
              : dueCount === 1
                ? "1 problem due through today"
                : `${dueCount} problems due through today`}
          </span>
        </span>

        <span className="reviews-due-trigger-meta">
          <span className={`reviews-due-count${dueCount > 0 ? " tone-attention" : ""}`}>{dueCount}</span>
          {hasScheduled ? (
            <ChevronDown className="reviews-due-chevron" size={18} aria-hidden="true" />
          ) : null}
        </span>
      </button>

      {open && hasScheduled ? (
        <ul className="revisit-cards reviews-due-list">
          {entries.map(({ problem, urgency, dateLabel }) => (
            <li key={problem.id}>
              <Link
                className={`revisit-card tone-${urgency}`}
                href={`/dashboard/dsa/${problem.id}`}
                prefetch={false}
              >
                <span className="revisit-card-date">{dateLabel}</span>
                <span className="revisit-card-name">{problem.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** @deprecated Prefer ReviewsDue */
export { ReviewsDue as UpcomingRevisits };
