"use client";

import { useEffect, useState } from "react";
import { QuickAddReviewChips } from "@/components/quick-add/QuickAddReviewChips";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import type { ReviewPreset } from "@/lib/review-schedule";

type ScheduleMode = "auto" | "manual";

type MarkReviewedSheetProps = {
  open: boolean;
  pending: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (schedule: {
    reviewPreset?: ReviewPreset;
    customReviewDate?: string;
  }) => void;
};

export function MarkReviewedSheet({ open, pending, error, onClose, onConfirm }: MarkReviewedSheetProps) {
  const [mode, setMode] = useState<ScheduleMode>("auto");
  const [manualSchedule, setManualSchedule] = useState<{
    reviewPreset?: ReviewPreset;
    customReviewDate?: string;
  }>({ reviewPreset: "oneWeek" });

  useEffect(() => {
    if (!open) return;
    setMode("auto");
    setManualSchedule({ reviewPreset: "oneWeek" });
  }, [open]);

  if (!open) return null;

  function submit() {
    if (mode === "auto") {
      onConfirm({});
      return;
    }

    if (manualSchedule.customReviewDate) {
      onConfirm({ customReviewDate: manualSchedule.customReviewDate });
      return;
    }

    onConfirm({ reviewPreset: manualSchedule.reviewPreset ?? "oneWeek" });
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        aria-labelledby="mark-reviewed-title"
        className="modal mark-reviewed-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header mark-reviewed-sheet-head">
          <div>
            <h2 id="mark-reviewed-title">Review completed!</h2>
            <p className="mark-reviewed-sheet-copy">How would you like to schedule the next review?</p>
          </div>
          <button aria-label="Close" className="modal-close" disabled={pending} onClick={onClose} type="button">
            ×
          </button>
        </div>

        {error ? <div className="error wide">{error}</div> : null}

        <div className="mark-reviewed-options" role="radiogroup" aria-label="Next review schedule">
          <label className={`mark-reviewed-option${mode === "auto" ? " active" : ""}`}>
            <input
              checked={mode === "auto"}
              disabled={pending}
              name="review-schedule-mode"
              onChange={() => setMode("auto")}
              type="radio"
              value="auto"
            />
            <span>
              <strong>Auto schedule</strong>
              <span className="mark-reviewed-option-hint">Recommended — based on confidence</span>
            </span>
          </label>

          <label className={`mark-reviewed-option${mode === "manual" ? " active" : ""}`}>
            <input
              checked={mode === "manual"}
              disabled={pending}
              name="review-schedule-mode"
              onChange={() => setMode("manual")}
              type="radio"
              value="manual"
            />
            <span>
              <strong>Choose review date manually</strong>
              <span className="mark-reviewed-option-hint">Pick a preset or custom date</span>
            </span>
          </label>
        </div>

        {mode === "manual" ? (
          <div className="mark-reviewed-manual">
            <QuickAddReviewChips onChange={setManualSchedule} initialPreset="oneWeek" />
          </div>
        ) : null}

        <div className="mark-reviewed-actions">
          <button className="button secondary" disabled={pending} onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={`button${pending ? " is-pending" : ""}`}
            disabled={pending || (mode === "manual" && !manualSchedule.reviewPreset && !manualSchedule.customReviewDate)}
            onClick={submit}
            type="button"
          >
            <ActionButtonContent pending={pending} pendingLabel="Saving…">
              Confirm
            </ActionButtonContent>
          </button>
        </div>
      </div>
    </div>
  );
}
