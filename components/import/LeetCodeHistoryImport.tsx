"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ActionButtonContent } from "@/components/ui/ActionButtonContent";
import { toastError, toastSuccess } from "@/lib/toast";
import { usePendingAction } from "@/hooks/usePendingAction";

type ImportResponse = {
  ok: true;
  username: string;
  imported: number;
  skipped: number;
  available: number;
  truncated: boolean;
};

export function LeetCodeHistoryImport() {
  const router = useRouter();
  const { run, isPending } = usePendingAction<"import">();
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState("");

  async function handleImport(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);

    await run("import", async () => {
      const response = await fetch("/api/problems/import/leetcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.ok) {
        const message = body?.error ?? "Could not import LeetCode history.";
        setError(message);
        toastError(message);
        return;
      }

      setResult(body as ImportResponse);
      if (body.imported > 0) {
        toastSuccess(`Imported ${body.imported} problem${body.imported === 1 ? "" : "s"}`);
        router.refresh();
      } else if (body.skipped > 0) {
        toastSuccess("All available problems were already tracked");
      } else {
        toastSuccess("No solved problems found for that user");
      }
    });
  }

  const importing = isPending("import");

  return (
    <div className="import-panel">
      <form className="import-form" onSubmit={handleImport}>
        <label className="quick-add-field" data-field="username">
          <span className="quick-add-label">LeetCode Username</span>
          <input
            name="username"
            placeholder="your-leetcode-username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            minLength={2}
          />
        </label>

        <p className="field-hint">
          Imports every solved problem available from LeetCode&apos;s public API. Confidence is left Unknown,
          notes stay empty, and no review date is set.
        </p>

        {error ? (
          <div className="error wide" role="alert">
            {error}
          </div>
        ) : null}

        <button className={`button wide${importing ? " is-saving" : ""}`} disabled={importing} type="submit">
          <ActionButtonContent pending={importing} pendingLabel="Importing…">
            Import solved problems
          </ActionButtonContent>
        </button>
      </form>

      {result ? (
        <div className="import-result" role="status">
          <p>
            Found <strong>{result.available}</strong> solved problem
            {result.available === 1 ? "" : "s"} for @{result.username}.
          </p>
          <p>
            Imported <strong>{result.imported}</strong>
            {result.skipped ? (
              <>
                {" "}
                · Skipped <strong>{result.skipped}</strong> already tracked
              </>
            ) : null}
          </p>
          {result.truncated ? (
            <p className="field-hint">
              LeetCode&apos;s public feed may not include your full history. Re-import later or add older
              problems via Quick Add with a problem URL.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
