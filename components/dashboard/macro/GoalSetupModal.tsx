"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DEFAULT_GOALS } from "@/lib/goals";

type GoalSetupModalProps = {
  onComplete: () => void;
  onClose?: () => void;
  initial?: {
    dailyDsaGoal: number;
    dailyApplicationsGoal: number;
    dailyProjectSessionsGoal: number;
  };
  mode?: "create" | "edit";
};

export function GoalSetupModal({
  onComplete,
  onClose,
  initial,
  mode = "create"
}: GoalSetupModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dailyDsaGoal, setDailyDsaGoal] = useState(initial?.dailyDsaGoal ?? DEFAULT_GOALS.dailyDsaGoal);
  const [dailyApplicationsGoal, setDailyApplicationsGoal] = useState(
    initial?.dailyApplicationsGoal ?? DEFAULT_GOALS.dailyApplicationsGoal
  );
  const [dailyProjectSessionsGoal, setDailyProjectSessionsGoal] = useState(
    initial?.dailyProjectSessionsGoal ?? DEFAULT_GOALS.dailyProjectSessionsGoal
  );

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = { dailyDsaGoal, dailyApplicationsGoal, dailyProjectSessionsGoal };
    const response = await fetch("/api/goals", {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not save goals." }));
      setError(body.error ?? "Could not save goals.");
      setLoading(false);
      return;
    }

    router.refresh();
    onComplete();
    setLoading(false);
  }

  return (
    <div className="modal-overlay" role="presentation">
      <div className="modal goal-modal" role="dialog" aria-modal="true" aria-labelledby="goal-modal-title">
        <div className="goal-modal-head">
          <div>
            <p className="section-eyebrow">Goals</p>
            <h2 id="goal-modal-title" className="panel-title">
              {mode === "create" ? "Set your daily targets" : "Edit daily targets"}
            </h2>
          </div>
          {onClose ? (
            <button type="button" className="icon-button secondary" aria-label="Close" onClick={onClose}>
              <X size={18} />
            </button>
          ) : null}
        </div>

        <p className="goal-modal-copy">
          Configure once. Switchboard tracks whether you&apos;re on track today.
        </p>

        <form className="goal-form" onSubmit={save}>
          <label className="field">
            <span>Daily DSA goal</span>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={dailyDsaGoal}
              onChange={(event) => setDailyDsaGoal(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>Daily applications goal</span>
            <input
              type="number"
              min={0}
              max={20}
              required
              value={dailyApplicationsGoal}
              onChange={(event) => setDailyApplicationsGoal(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>Daily project sessions goal</span>
            <input
              type="number"
              min={0}
              max={20}
              required
              value={dailyProjectSessionsGoal}
              onChange={(event) => setDailyProjectSessionsGoal(Number(event.target.value))}
            />
          </label>

          {error ? <p className="field-error">{error}</p> : null}

          <button className="button" type="submit" disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Save goals" : "Update goals"}
          </button>
        </form>
      </div>
    </div>
  );
}
