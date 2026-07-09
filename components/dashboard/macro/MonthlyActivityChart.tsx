import {
  activityBarHeightPercent,
  TARGET_LINE_PERCENT,
  type ActivityTrendDay
} from "@/lib/monthly-activity-trend";

type MonthlyActivityChartProps = {
  days: ActivityTrendDay[];
  dailyTarget: number;
};

export function MonthlyActivityChart({ days, dailyTarget }: MonthlyActivityChartProps) {
  return (
    <section className="monthly-trend" aria-label="Activity trend for the last 30 days">
      <p className="monthly-trend-title">Activity trend</p>

      <div className="monthly-trend-chart-wrap">
        <div className="monthly-trend-chart" role="img" aria-hidden="true">
          <div
            className="monthly-trend-target-line"
            style={{ bottom: `${TARGET_LINE_PERCENT}%` }}
          />

          {days.map((day, index) => {
            const height = activityBarHeightPercent(day.actions, dailyTarget);

            return (
              <div
                key={index}
                className={[
                  "monthly-trend-bar",
                  day.isToday ? "is-today" : "",
                  height === 0 ? "is-empty" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {height > 0 ? (
                  <div className="monthly-trend-bar-fill" style={{ height: `${height}%` }} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <p className="monthly-trend-caption">Last 30 days</p>
    </section>
  );
}
