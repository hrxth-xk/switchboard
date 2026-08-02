"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClipboardEvent } from "react";
import { toastSuccess } from "@/lib/toast";

export type ImportPhase = "idle" | "loading" | "success" | "partial" | "failed";

export type UrlImportOutcome<TResult> = {
  result: TResult;
  /** Fields the server could not resolve; empty means a clean import. */
  unresolved: string[];
  notice?: string | null;
};

export type UseUrlImportOptions<TResult> = {
  endpoint: string;
  isSupportedUrl: (value: string) => boolean;
  /** Narrow the response body. Return null to treat the response as a failure. */
  select: (body: unknown) => UrlImportOutcome<TResult> | null;
  /** Write the values into form state. Called immediately after captureSnapshot. */
  apply: (result: TResult) => void;
  captureSnapshot: () => Record<string, string>;
  restoreSnapshot: (snapshot: Record<string, string>) => void;
  describe: (outcome: UrlImportOutcome<TResult>) => string;
  fallbackMessage: string;
  loadingMessage: string;
  /** false in edit mode — only an explicit importNow() may fire. */
  autoRun?: boolean;
  /** true while the form is saving, so an import can't race the submit. */
  disabled?: boolean;
  debounceMs?: number;
};

/**
 * Shared "paste a URL and we'll fill the form" behaviour.
 *
 * Deliberate differences from the ad-hoc version this replaces:
 *  - a failed URL can be retried (the attempt map only short-circuits successes)
 *  - requests are aborted, not merely ignored, when superseded or disabled
 *  - every successful fill is undoable
 *  - typing triggers a debounced import; paste fires immediately
 */
export function useUrlImport<TResult>(options: UseUrlImportOptions<TResult>) {
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [unresolved, setUnresolved] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Options change identity every render; keep them in a ref so the returned
  // callbacks stay stable and can't capture stale form state.
  const latest = useRef(options);
  latest.current = options;

  const attempted = useRef(new Map<string, "ok" | "failed">());
  const snapshot = useRef<Record<string, string> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<number | null>(null);
  const requestId = useRef(0);

  const cancelPending = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    controller.current?.abort();
    controller.current = null;
  }, []);

  const undo = useCallback(() => {
    const previous = snapshot.current;
    if (!previous) return;

    latest.current.restoreSnapshot(previous);
    snapshot.current = null;
    setCanUndo(false);
    setPhase("idle");
    setMessage("");
    setNotice(null);
    setUnresolved([]);
    // The URL stays marked "ok", so blurring the field won't immediately
    // re-apply what the user just undid. Re-import is still available.
  }, []);

  const run = useCallback(
    async (rawValue: string, force = false) => {
      const value = rawValue.trim();
      const config = latest.current;

      if (!value || config.disabled) return;
      if (!config.isSupportedUrl(value)) return;
      if (!force && attempted.current.get(value) === "ok") return;

      cancelPending();
      const abort = new AbortController();
      controller.current = abort;
      const id = ++requestId.current;

      setPhase("loading");
      setMessage(config.loadingMessage);
      setNotice(null);

      try {
        const response = await fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
          signal: abort.signal
        });

        const body: unknown = await response.json().catch(() => null);
        if (id !== requestId.current) return;

        const outcome = response.ok ? config.select(body) : null;

        if (!outcome) {
          attempted.current.set(value, "failed");
          setPhase("failed");
          setMessage(serverError(body) ?? config.fallbackMessage);
          return;
        }

        snapshot.current = config.captureSnapshot();
        config.apply(outcome.result);
        attempted.current.set(value, "ok");

        setCanUndo(true);
        setUnresolved(outcome.unresolved);
        setNotice(outcome.notice ?? null);
        setPhase(outcome.unresolved.length > 0 ? "partial" : "success");
        setMessage("");

        toastSuccess(config.describe(outcome), {
          action: { label: "Undo", onClick: undo }
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (id !== requestId.current) return;
        attempted.current.set(value, "failed");
        setPhase("failed");
        setMessage(config.fallbackMessage);
      } finally {
        if (controller.current === abort) controller.current = null;
      }
    },
    [cancelPending, undo]
  );

  const onUrlChange = useCallback(
    (value: string) => {
      cancelPending();
      const config = latest.current;
      if (config.autoRun === false || config.disabled) return;
      if (!config.isSupportedUrl(value.trim())) return;

      timer.current = window.setTimeout(() => {
        void run(value);
      }, config.debounceMs ?? 500);
    },
    [cancelPending, run]
  );

  const onUrlPaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      const config = latest.current;
      if (config.autoRun === false || config.disabled) return;

      // Read the clipboard directly — the input's value hasn't updated yet, and
      // probing document.activeElement in a timeout is fragile.
      const pasted = event.clipboardData.getData("text")?.trim();
      if (!pasted || !config.isSupportedUrl(pasted)) return;

      cancelPending();
      void run(pasted);
    },
    [cancelPending, run]
  );

  const onUrlBlur = useCallback(
    (value: string) => {
      const config = latest.current;
      if (config.autoRun === false || config.disabled) return;
      cancelPending();
      void run(value);
    },
    [cancelPending, run]
  );

  /** Explicit user action — ignores the attempt map, so Retry always works. */
  const importNow = useCallback(
    (value: string) => {
      cancelPending();
      void run(value, true);
    },
    [cancelPending, run]
  );

  useEffect(() => {
    if (options.disabled) cancelPending();
  }, [options.disabled, cancelPending]);

  useEffect(() => {
    return () => {
      requestId.current += 1;
      cancelPending();
    };
  }, [cancelPending]);

  return {
    phase,
    message,
    notice,
    unresolved,
    canUndo,
    undo,
    importNow,
    onUrlChange,
    onUrlPaste,
    onUrlBlur
  };
}

function serverError(body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return null;
}
