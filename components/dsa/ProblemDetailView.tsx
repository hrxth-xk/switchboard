"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { CONFIDENCE_LABELS, formatReviewDueLabel, formatShortDate, type ProblemRow } from "@/lib/problem-utils";

type ProblemDetailViewProps = {
  problem: ProblemRow;
};

export function ProblemDetailView({ problem }: ProblemDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function markReviewed() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/problems/${problem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revisit" })
    });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not mark reviewed." }));
      setError(body.error);
      return;
    }
    router.refresh();
  }

  async function deleteProblem() {
    if (!window.confirm(`Delete ${problem.name}?`)) return;

    setLoading(true);
    setError("");
    const response = await fetch(`/api/problems/${problem.id}`, { method: "DELETE" });
    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not delete problem." }));
      setError(body.error);
      return;
    }
    router.push("/dashboard/dsa");
    router.refresh();
  }

  return (
    <>
      <div className="workspace-page">
        <header className="page-header page-header-back">
          <Link className="back-link" href="/dashboard/dsa">
            ← DSA
          </Link>
          <h1 className="page-title">{problem.name}</h1>
        </header>

        <div className="detail-panel">
          {error ? <div className="error wide">{error}</div> : null}

          <dl className="detail-grid">
            <div>
              <dt>Platform</dt>
              <dd>{problem.url ? "Link available" : "Not linked"}</dd>
            </div>
            <div>
              <dt>Problem Link</dt>
              <dd>
                {problem.url ? (
                  <a href={problem.url} rel="noreferrer" target="_blank">
                    Open problem
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>Topic</dt>
              <dd>{problem.topic}</dd>
            </div>
            <div>
              <dt>Pattern</dt>
              <dd>{problem.pattern ?? "—"}</dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>
                {problem.confidence}/5 · {CONFIDENCE_LABELS[problem.confidence]}
              </dd>
            </div>
            <div>
              <dt>Last Practiced</dt>
              <dd>{formatShortDate(problem.lastPracticed)}</dd>
            </div>
            <div>
              <dt>Next Review Date</dt>
              <dd>{problem.nextReview ? formatReviewDueLabel(problem.nextReview) : "—"}</dd>
            </div>
            <div>
              <dt>Revision Count</dt>
              <dd>{problem.revisitCount}</dd>
            </div>
          </dl>

          <div className="detail-notes">
            <p className="detail-notes-label">Personal Notes</p>
            <p className="detail-notes-body">{problem.notes?.trim() || "No notes yet."}</p>
          </div>

          <div className="detail-actions">
            <button className="button" disabled={loading} onClick={() => setEditing(true)} type="button">
              Edit Problem
            </button>
            <button className="button secondary" disabled={loading} onClick={markReviewed} type="button">
              Mark Reviewed
            </button>
            <button className="button danger" disabled={loading} onClick={deleteProblem} type="button">
              Delete Problem
            </button>
          </div>
        </div>
      </div>

      <EntrySheet
        editTarget={editing ? { type: "problem", data: problem } : null}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
