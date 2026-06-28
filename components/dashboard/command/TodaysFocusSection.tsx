import Link from "next/link";
import type { FocusItem } from "@/lib/command-center";

const KIND_LABELS: Record<FocusItem["kind"], string> = {
  problem: "DSA",
  application: "Application",
  project: "Project"
};

export function TodaysFocusSection({ items }: { items: FocusItem[] }) {
  return (
    <section className="focus-hero">
      <header className="focus-hero-header">
        <p className="section-eyebrow">Today&apos;s focus</p>
        <h1 className="focus-hero-title">What should I do today?</h1>
      </header>

      {items.length ? (
        <div className="focus-grid">
          {items.map((item) => (
            <Link className="focus-item" href={item.href} key={`${item.kind}-${item.title}`}>
              <p className="focus-item-kind">{KIND_LABELS[item.kind]}</p>
              <p className="focus-item-title">{item.title}</p>
              <p className="focus-item-meta">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-inline">Nothing queued yet. Use Quick Add to log a problem, application, or project.</p>
      )}
    </section>
  );
}
