"use client";

import { useState } from "react";
import type { UserGoalsData } from "@/lib/goals";
import { GoalSetupModal } from "@/components/dashboard/macro/GoalSetupModal";

type GoalsEditorProps = {
  goals: UserGoalsData | null;
};

export function GoalsEditor({ goals }: GoalsEditorProps) {
  const [editing, setEditing] = useState(false);

  if (!goals) {
    return (
      <div className="goals-page-empty">
        <p>No goals configured yet.</p>
        <button className="button" type="button" onClick={() => setEditing(true)}>
          Set goals
        </button>
        {editing ? <GoalSetupModal mode="create" onComplete={() => setEditing(false)} /> : null}
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="goals-summary">
        <div className="goals-row">
          <span>Daily DSA</span>
          <strong>{goals.dailyDsaGoal}</strong>
        </div>
        <div className="goals-row">
          <span>Daily applications</span>
          <strong>{goals.dailyApplicationsGoal}</strong>
        </div>
        <div className="goals-row">
          <span>Daily project sessions</span>
          <strong>{goals.dailyProjectSessionsGoal}</strong>
        </div>
      </div>

      <button className="button secondary" type="button" onClick={() => setEditing(true)}>
        Edit goals
      </button>

      {editing ? (
        <GoalSetupModal
          mode="edit"
          initial={goals}
          onComplete={() => setEditing(false)}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </div>
  );
}
