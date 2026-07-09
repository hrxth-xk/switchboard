export function DashboardPageLoading() {
  return (
    <div className="page-loading workspace-page" aria-busy="true" aria-label="Loading page">
      <header className="page-header page-loading-header">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-kicker" />
      </header>

      <div className="page-loading-hero">
        <div className="skeleton skeleton-circle" />
        <div className="page-loading-hero-copy">
          <div className="skeleton skeleton-line skeleton-line-md" />
          <div className="skeleton skeleton-line skeleton-line-sm" />
        </div>
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
