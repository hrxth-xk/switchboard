export function ListPageLoading() {
  return (
    <div className="page-loading workspace-page" aria-busy="true" aria-label="Loading page">
      <header className="page-header page-loading-header">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-kicker" />
      </header>

      <div className="page-loading-toolbar">
        <div className="skeleton skeleton-pill" />
        <div className="skeleton skeleton-pill" />
        <div className="skeleton skeleton-pill" />
      </div>

      <div className="page-loading-list">
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
      </div>
    </div>
  );
}
