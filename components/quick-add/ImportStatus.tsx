"use client";

import { SavingSpinner } from "@/components/ui/SavingSpinner";
import type { ImportPhase } from "@/hooks/useUrlImport";

type ImportStatusProps = {
  phase: ImportPhase;
  message: string;
  notice?: string | null;
  onRetry?: () => void;
};

/** Inline status line for the paste-a-URL flows in Quick Add. */
export function ImportStatus({ phase, message, notice, onRetry }: ImportStatusProps) {
  const showLine = phase === "loading" || phase === "failed";

  if (!showLine && !notice) return null;

  return (
    <>
      {showLine ? (
        <p
          className={`job-import-status${phase === "failed" ? " is-error" : ""}`}
          role="status"
          aria-live="polite"
        >
          {phase === "loading" ? <SavingSpinner size={14} /> : null}
          <span>{message}</span>
          {phase === "failed" && onRetry ? (
            <button className="job-import-retry" onClick={onRetry} type="button">
              Retry
            </button>
          ) : null}
        </p>
      ) : null}

      {notice && phase !== "loading" ? (
        <p className="job-import-status is-notice" role="status">
          {notice}
        </p>
      ) : null}
    </>
  );
}
