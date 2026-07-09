type WeeklyDayCellProps = {
  count: number;
  target: number;
  isToday?: boolean;
  isFuture?: boolean;
};

export function WeeklyDayCell({ count, target, isToday = false, isFuture = false }: WeeklyDayCellProps) {
  const fillPercent = target > 0 ? Math.min((count / target) * 100, 100) : 0;
  const exceeded = target > 0 && count > target;
  const isEmpty = count === 0;
  const isComplete = target > 0 && count >= target;

  return (
    <div
      className={[
        "weekly-cell",
        isToday ? "is-today" : "",
        isFuture ? "is-future" : "",
        isEmpty ? "is-empty" : "",
        !isEmpty && !isComplete ? "is-partial" : "",
        isComplete ? "is-complete" : "",
        exceeded ? "is-exceeded" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      <div className="weekly-cell-track">
        <div className="weekly-cell-fill" style={{ height: `${fillPercent}%` }} />
      </div>
    </div>
  );
}
