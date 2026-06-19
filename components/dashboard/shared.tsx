import type { ReactNode } from "react";

export function Panel({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">{title}</h2>
          <p className="panel-kicker">{kicker}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="item-meta">{text}</p>;
}
