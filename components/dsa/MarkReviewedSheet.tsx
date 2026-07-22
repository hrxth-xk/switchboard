"use client";

import { useEffect, useState } from "react";
import { QuickAddReviewChips } from "@/components/quick-add/QuickAddReviewChips";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { Modal } from "@/components/ui/Modal";
import type { ReviewPreset } from "@/lib/review-schedule";

type ScheduleMode = "auto" | "manual";
type SheetStep = "choose" | "manual";

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
  const [step, setStep] = useState<SheetStep>("choose");
  const [mode, setMode] = useState<ScheduleMode>("auto");
  const [manualSchedule, setManualSchedule] = useState<{
    reviewPreset?: ReviewPreset;
    customReviewDate?: string;
  }>({ reviewPreset: "oneWeek" });

  useEffect(() => {
    if (!open) return;
    setStep("choose");
    setMode("auto");
    setManualSchedule({ reviewPreset: "oneWeek" });
  }, [open]);

  function handleChooseContinue() {
    if (mode === "auto") {
      onConfirm({});
      return;
    }
    setStep("manual");
  }

  function handleManualSave() {
    if (manualSchedule.customReviewDate) {
      onConfirm({ customReviewDate: manualSchedule.customReviewDate });
      return;
    }
    onConfirm({ reviewPreset: manualSchedule.reviewPreset ?? "oneWeek" });
  }

  const manualReady = Boolean(manualSchedule.reviewPreset || manualSchedule.customReviewDate);

  return (
    <Modal
      className="mark-reviewed-sheet"
      closeOnOverlayClick={!pending}
      labelledBy="mark-reviewed-title"
      onClose={pending ? () => {} : onClose}
      open={open}
    >
      {step === "choose" ? (
        <>
          <div className="modal-header mark-reviewed-sheet-head">
            <div>
              <h2 id="mark-reviewed-title">Review completed!</h2>
              <p className="mark-reviewed-sheet-copy">How would you like to schedule the next review?</p>
            </div>
            <button aria-label="Close" className="modal-close" disabled={pending} onClick={onClose} type="button">
              ×
            </button>
          </div>

          {error ? <div className="error wide" role="alert">{error}</div> : null}

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

          <div className="mark-reviewed-actions">
            <button className="button secondary" disabled={pending} onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className={`button${pending ? " is-pending" : ""}`}
              disabled={pending}
              onClick={handleChooseContinue}
              type="button"
            >
              <ActionButtonContent pending={pending} pendingLabel="Saving…">
                {mode === "auto" ? "Confirm" : "Continue"}
              </ActionButtonContent>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="modal-header mark-reviewed-sheet-head">
            <div>
              <h2 id="mark-reviewed-title">Choose next review</h2>
              <p className="mark-reviewed-sheet-copy">When should this problem come back?</p>
            </div>
            <button aria-label="Close" className="modal-close" disabled={pending} onClick={onClose} type="button">
              ×
            </button>
          </div>

          {error ? <div className="error wide" role="alert">{error}</div> : null}

          <div className="mark-reviewed-manual">
            <QuickAddReviewChips onChange={setManualSchedule} initialPreset="oneWeek" />
          </div>

          <div className="mark-reviewed-actions">
            <button className="button secondary" disabled={pending} onClick={() => setStep("choose")} type="button">
              Cancel
            </button>
            <button
              className={`button${pending ? " is-pending" : ""}`}
              disabled={pending || !manualReady}
              onClick={handleManualSave}
              type="button"
            >
              <ActionButtonContent pending={pending} pendingLabel="Saving…">
                Save
              </ActionButtonContent>
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

