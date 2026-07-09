"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CONFIDENCE_LABELS, formatReviewDueLabel, formatShortDate, type ProblemRow } from "@/lib/problem-utils";

const PAGE_SIZE = 12;

type TrackedProblemsProps = {
  problems: ProblemRow[];
};

export function TrackedProblems({ problems }: TrackedProblemsProps) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return problems;
    return problems.filter(
      (problem) =>
        problem.name.toLowerCase().includes(value) ||
        problem.topic.toLowerCase().includes(value) ||
        (problem.pattern?.toLowerCase().includes(value) ?? false)
    );
  }, [problems, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <section className="workspace-section tracked-problems-section">
      <header className="tracked-problems-header">
        <div className="tracked-problems-heading">
          <h2 className="workspace-section-title">Tracked Problems</h2>
          <p className="workspace-section-kicker">{problems.length} logged</p>
        </div>
        <input
          className="table-search workspace-search tracked-problems-search"
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search problems…"
          type="search"
          value={query}
        />
      </header>

      {visible.length ? (
        <ul className="entity-card-list">
          {visible.map((problem) => (
            <li key={problem.id}>
              <Link className="entity-card" href={`/dashboard/dsa/${problem.id}`}>
                <div className="entity-card-top">
                  <p className="entity-card-title">{problem.name}</p>
                  <span className="entity-card-badge scan-topic">{problem.topic}</span>
                </div>
                <p className="entity-card-line scan-pattern">{problem.pattern ?? "No pattern set"}</p>
                <p className="entity-card-line">
                  Confidence {problem.confidence}/5 · {CONFIDENCE_LABELS[problem.confidence]}
                </p>
                <div className="entity-card-grid">
                  <div>
                    <p className="entity-card-label">Last Practiced</p>
                    <p className="entity-card-value">{formatShortDate(problem.lastPracticed)}</p>
                  </div>
                  <div>
                    <p className="entity-card-label">Next Review</p>
                    <p className="entity-card-value scan-review">
                      {problem.nextReview ? formatReviewDueLabel(problem.nextReview) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="entity-card-label">Revisions</p>
                    <p className="entity-card-value">{problem.revisitCount}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline workspace-empty">
          {problems.length ? "No problems match that search." : "Log your first problem with Quick Add."}
        </p>
      )}

      {hasMore ? (
        <button
          className="button secondary load-more-btn"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          type="button"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}
