"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Braces } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerList } from "@/components/ui/StaggerList";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { formatConfidence, formatReviewDueLabel, formatShortDate, type ProblemRow } from "@/lib/problem-utils";

const PAGE_SIZE = 12;

type TrackedProblemsProps = {
  problems: ProblemRow[];
};

export function TrackedProblems({ problems }: TrackedProblemsProps) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

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
        <StaggerList
          className="entity-card-list"
          getKey={(problem) => problem.id}
          items={visible}
          renderItem={(problem) => (
            <Link className="entity-card" href={`/dashboard/dsa/${problem.id}`} prefetch={false}>
              <div className="entity-card-top">
                <p className="entity-card-title">{problem.name}</p>
                <span className="entity-card-badge scan-topic">{problem.topic}</span>
              </div>
              <p className="entity-card-line scan-pattern">{problem.pattern ?? "No pattern set"}</p>
              <p className="entity-card-line">{formatConfidence(problem.confidence)}</p>
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
          )}
        />
      ) : problems.length ? (
        <p className="empty-inline workspace-empty">No problems match that search.</p>
      ) : (
        <EmptyState
          action={
            <button className="button" onClick={() => setQuickAddOpen(true)} type="button">
              Log a problem
            </button>
          }
          description="Track problems you've solved, rate your confidence, and Switchboard will schedule spaced-repetition reviews."
          icon={Braces}
          title="No problems logged yet"
        />
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

      <EntrySheet initialMode="problem" onClose={() => setQuickAddOpen(false)} open={quickAddOpen} />
    </section>
  );
}
