export function DashboardPageLoading() {
  return (
    <div className="page-loading macro-dashboard" aria-busy="true" aria-label="Loading dashboard">
      <header className="page-loading-macro-hero">
        <div className="skeleton skeleton-line skeleton-line-sm" />
        <div className="skeleton skeleton-title skeleton-title-lg" />
        <div className="skeleton skeleton-line skeleton-line-md" />
      </header>

      <div className="page-loading-gauge">
        <div className="skeleton skeleton-circle skeleton-circle-lg" />
      </div>

      <div className="page-loading-trackers">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" />
      </div>

      <div className="page-loading-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}
