import { WeeklyDayCell } from "@/components/dashboard/macro/WeeklyDayCell";
import type { WeeklyDayBreakdown } from "@/lib/weekly-breakdown";
import { METRIC_LABELS, type MetricKey } from "@/lib/progress-metrics";

const METRIC_ORDER: MetricKey[] = ["dsa", "applications", "projects"];

type WeeklyConsistencyGridProps = {
  days: WeeklyDayBreakdown[];
};

export function WeeklyConsistencyGrid({ days }: WeeklyConsistencyGridProps) {
  return (
    <div className="weekly-tracker" role="img" aria-label="Weekly consistency by category">
      <div className="weekly-tracker-head">
        <span className="weekly-tracker-corner" aria-hidden="true" />
        {days.map((day) => (
          <span
            key={`head-${day.dayNumber}`}
            className={`weekly-tracker-day${day.isToday ? " is-today" : ""}${day.isFuture ? " is-future" : ""}`}
          >
            {day.shortLabel}
          </span>
        ))}
      </div>

      {METRIC_ORDER.map((metric) => (
        <div key={metric} className="weekly-tracker-row">
          <span className="weekly-tracker-label">{METRIC_LABELS[metric]}</span>
          {days.map((day) => (
            <WeeklyDayCell
              key={`${metric}-${day.dayNumber}`}
              count={day.counts[metric]}
              target={day.targets[metric]}
              isToday={day.isToday}
              isFuture={day.isFuture}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
