type ProblemStatsStripProps = {
  total: number;
  reviewDue: number;
  avgConfidence: number;
  patternsCovered: number;
};

export function ProblemStatsStrip({ total, reviewDue, avgConfidence, patternsCovered }: ProblemStatsStripProps) {
  return (
    <section className="metric-strip">
      <div className="metric-cell">
        <span className="metric-value">{total}</span>
        <span className="metric-label">Problems tracked</span>
      </div>
      <div className="metric-cell">
        <span className="metric-value">{reviewDue}</span>
        <span className="metric-label">Reviews due</span>
      </div>
      <div className="metric-cell">
        <span className="metric-value">{avgConfidence || "—"}</span>
        <span className="metric-label">Average confidence</span>
      </div>
      <div className="metric-cell">
        <span className="metric-value">{patternsCovered}</span>
        <span className="metric-label">Patterns covered</span>
      </div>
    </section>
  );
}
