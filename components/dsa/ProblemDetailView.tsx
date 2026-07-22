"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntrySheet } from "@/components/quick-add/EntrySheet";
import { MarkReviewedSheet } from "@/components/dsa/MarkReviewedSheet";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { formatConfidence, formatReviewDueLabel, formatShortDate, type ProblemRow } from "@/lib/problem-utils";
import type { ReviewPreset } from "@/lib/review-schedule";
import { withNextRevisitToast } from "@/lib/review-schedule";
import { toastSuccess } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { usePendingAction } from "@/hooks/usePendingAction";

type ProblemDetailViewProps = {
  problem: ProblemRow;
};

export function ProblemDetailView({ problem }: ProblemDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { run, isPending, isBusy } = usePendingAction<"delete" | "review">();
  const { confirm, confirmDialog } = useConfirm();
  const [error, setError] = useState("");

  async function confirmReviewed(schedule: { reviewPreset?: ReviewPreset; customReviewDate?: string }) {
    setError("");
    await run("review", async () => {
      const response = await fetch(`/api/problems/${problem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revisit",
          ...(schedule.customReviewDate
            ? { customReviewDate: schedule.customReviewDate }
            : schedule.reviewPreset
              ? { reviewPreset: schedule.reviewPreset }
              : {})
        })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not mark reviewed." }));
        setError(body.error);
        return;
      }
      setScheduleOpen(false);
      toastSuccess(withNextRevisitToast("Problem reviewed", schedule));
      router.refresh();
    });
  }

  async function deleteProblem() {
    const confirmed = await confirm({
      title: `Delete ${problem.name}?`,
      description: "This can't be undone.",
      confirmLabel: "Delete"
    });
    if (!confirmed) return;

    setError("");
    await run("delete", async () => {
      const response = await fetch(`/api/problems/${problem.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Could not delete problem." }));
        setError(body.error);
        return;
      }
      toastSuccess("Deleted");
      router.push("/dashboard/dsa");
      router.refresh();
    });
  }

  const reviewing = isPending("review");
  const deleting = isPending("delete");

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
          {error && !scheduleOpen ? <div className="error wide" role="alert">{error}</div> : null}

          <dl className="detail-grid">
            <div>
              <dt>Platform</dt>
              <dd>
                {problem.slug || problem.url?.includes("leetcode.com")
                  ? "LeetCode"
                  : problem.url
                    ? "Link available"
                    : "Not linked"}
              </dd>
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
              <dd>{problem.difficulty ?? "—"}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{formatConfidence(problem.confidence)}</dd>
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
            <button className="button" disabled={isBusy} onClick={() => setEditing(true)} type="button">
              Edit Problem
            </button>
            <button
              className="button secondary"
              disabled={isBusy}
              onClick={() => {
                setError("");
                setScheduleOpen(true);
              }}
              type="button"
            >
              Mark Reviewed
            </button>
            <button
              className={`button danger${deleting ? " is-pending" : ""}`}
              disabled={isBusy}
              onClick={deleteProblem}
              type="button"
            >
              <ActionButtonContent pending={deleting} pendingLabel="Deleting…">
                Delete Problem
              </ActionButtonContent>
            </button>
          </div>
        </div>
      </div>

      <MarkReviewedSheet
        error={scheduleOpen ? error : ""}
        onClose={() => {
          if (!reviewing) setScheduleOpen(false);
        }}
        onConfirm={confirmReviewed}
        open={scheduleOpen}
        pending={reviewing}
      />

      <EntrySheet
        editTarget={editing ? { type: "problem", data: problem } : null}
        open={editing}
        onClose={() => setEditing(false)}
      />

      {confirmDialog}
    </>
  );
}

