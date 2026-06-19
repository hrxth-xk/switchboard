import type { ReactNode } from "react";
import type { TodaysFocusData } from "@/lib/dashboard-utils";
import { formatDate } from "@/lib/dashboard-utils";
import { percent } from "@/lib/summary";

type TodaysFocusProps = {
  focus: TodaysFocusData;
};

export function TodaysFocus({ focus }: TodaysFocusProps) {
  return (
    <section className="focus-section">
      <div className="focus-header">
        <h2 className="panel-title">Today&apos;s Focus</h2>
        <p className="panel-kicker">What should I do today?</p>
      </div>
      <div className="focus-grid">
        <FocusCard label="Upcoming interview">
          {focus.interview ? (
            <>
              <p className="focus-action-title">{focus.interview.company}</p>
              <p className="focus-action-meta">
                {formatDate(focus.interview.scheduledAt)} · {focus.interview.round}
              </p>
            </>
          ) : (
            <p className="focus-action-empty">No upcoming interviews scheduled</p>
          )}
        </FocusCard>

        <FocusCard label="Next application action">
          {focus.application ? (
            <>
              <p className="focus-action-title">{focus.application.company}</p>
              <p className="focus-action-meta">
                {focus.application.nextStep ?? `Follow up on ${focus.application.status.toLowerCase()} stage`}
              </p>
            </>
          ) : (
            <p className="focus-action-empty">Add companies to your pipeline</p>
          )}
        </FocusCard>

        <FocusCard label="Nearest goal deadline">
          {focus.goal ? (
            <>
              <p className="focus-action-title">{focus.goal.title}</p>
              <p className="focus-action-meta">
                {focus.goal.current}/{focus.goal.target} {focus.goal.metric} · due {formatDate(focus.goal.dueDate)}
              </p>
            </>
          ) : (
            <p className="focus-action-empty">No active goals right now</p>
          )}
        </FocusCard>

        <FocusCard label="Topic needing attention">
          {focus.topic ? (
            <>
              <p className="focus-action-title">{focus.topic.title}</p>
              <p className="focus-action-meta">
                {focus.topic.status.toLowerCase()} · confidence {focus.topic.confidence}/5 ·{" "}
                {percent(focus.topic.solvedCount, focus.topic.targetCount)}% complete
              </p>
            </>
          ) : (
            <p className="focus-action-empty">Add a topic to start learning</p>
          )}
        </FocusCard>
      </div>
    </section>
  );
}

function FocusCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <article className="focus-card">
      <p className="focus-label">{label}</p>
      {children}
    </article>
  );
}
