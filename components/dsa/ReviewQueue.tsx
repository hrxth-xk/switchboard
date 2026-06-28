"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProblemEditor } from "@/components/dsa/ProblemEditor";
import { formatShortDate, type ProblemRow } from "@/lib/problem-utils";

type ReviewQueueProps = {
  problems: ProblemRow[];
};

export function ReviewQueue({ problems }: ReviewQueueProps) {
  const [editing, setEditing] = useState<ProblemRow | null>(null);

  return (
    <>
      <section className="section-block">
        <header className="section-header">
          <h2 className="section-title">Review queue</h2>
          <p className="section-kicker">{problems.length ? `${problems.length} due` : "Nothing due"}</p>
        </header>

        {problems.length ? (
          <ul className="review-queue">
            {problems.map((problem) => (
              <ReviewRow key={problem.id} onEdit={() => setEditing(problem)} problem={problem} />
            ))}
          </ul>
        ) : (
          <p className="empty-inline">No reviews scheduled for today.</p>
        )}
      </section>

      {editing ? <ProblemEditor problem={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function ReviewRow({ problem, onEdit }: { problem: ProblemRow; onEdit: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function revisit(event: MouseEvent) {
    event.stopPropagation();
    setLoading(true);
    const response = await fetch(`/api/problems/${problem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revisit" })
    });
    setLoading(false);
    if (response.ok) router.refresh();
  }

  return (
    <li className="review-row">
      <button className="review-row-main" type="button" onClick={onEdit}>
        <span className="review-row-title">{problem.name}</span>
        <span className="review-row-meta">
          {problem.topic}
          {problem.pattern ? ` · ${problem.pattern}` : ""} · {problem.confidence}/5
        </span>
      </button>
      <div className="review-row-side">
        <span className="review-row-due">
          {problem.nextReview ? formatShortDate(problem.nextReview) : "Today"}
        </span>
        <button className="button compact" disabled={loading} type="button" onClick={revisit}>
          {loading ? "…" : "Revisit"}
        </button>
      </div>
    </li>
  );
}
