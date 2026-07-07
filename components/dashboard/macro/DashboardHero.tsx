export function DashboardHero() {
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());

  return (
    <header className="macro-hero">
      <p className="macro-hero-date">{dateLabel}</p>
      <h1 className="macro-hero-title">Dashboard</h1>
      <p className="macro-hero-tagline">Stay on pace. Small wins compound.</p>
    </header>
  );
}
