type OverviewStatsProps = {
  dsaProgress: number;
  activeApplications: number;
  upcomingInterviews: number;
  goalProgress: number;
};

const items = [
  { key: "dsa", label: "DSA progress", format: (stats: OverviewStatsProps) => `${stats.dsaProgress}%` },
  { key: "applications", label: "Active applications", format: (stats: OverviewStatsProps) => stats.activeApplications.toString() },
  { key: "interviews", label: "Upcoming interviews", format: (stats: OverviewStatsProps) => stats.upcomingInterviews.toString() },
  { key: "goals", label: "Goal progress", format: (stats: OverviewStatsProps) => `${stats.goalProgress}%` }
] as const;

export function OverviewStats(props: OverviewStatsProps) {
  return (
    <section className="stats-strip" aria-label="Overview stats">
      {items.map((item) => (
        <div className="stats-strip-item" key={item.key}>
          <p className="stats-strip-label">{item.label}</p>
          <p className="stats-strip-value">{item.format(props)}</p>
        </div>
      ))}
    </section>
  );
}
