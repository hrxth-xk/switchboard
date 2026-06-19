import type { Topic } from "@prisma/client";
import { EmptyState, Panel } from "@/components/dashboard/shared";
import { percent } from "@/lib/summary";

type LearningMapPreviewProps = {
  topics: Topic[];
};

export function LearningMapPreview({ topics }: LearningMapPreviewProps) {
  return (
    <Panel title="Learning map" kicker="Compact DSA and system design preview">
      {topics.length ? (
        <div className="list scroll-panel scroll-panel-compact">
          {topics.map((topic) => (
            <div className="item item-compact" key={topic.id}>
              <div className="item-row">
                <div>
                  <p className="item-title">{topic.title}</p>
                  <p className="item-meta">
                    {topic.category} · confidence {topic.confidence}/5
                  </p>
                </div>
                <span className="pill">{topic.status}</span>
              </div>
              <div className="progress" aria-label={`${topic.title} progress`}>
                <span style={{ width: `${percent(topic.solvedCount, topic.targetCount)}%` }} />
              </div>
              <p className="item-meta">
                {topic.solvedCount}/{topic.targetCount} reps · {topic.difficulty.toLowerCase()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Add your first topic from Quick add." />
      )}
    </Panel>
  );
}
