import type { ReactNode } from "react";

export function ExecCard({
  label,
  title,
  meta,
  next,
  primary
}: {
  label: string;
  title: string;
  meta?: ReactNode;
  next?: string;
  primary?: boolean;
}) {
  return (
    <article className={`exec-card${primary ? " exec-card-primary" : ""}`}>
      <p className="exec-card-label">{label}</p>
      <p className="exec-card-title">{title}</p>
      {meta ? <div className="exec-card-meta">{meta}</div> : null}
      {next ? (
        <p className="exec-card-next">
          <span>Next</span>
          {next}
        </p>
      ) : null}
    </article>
  );
}

export function ExecSection({
  title,
  kicker,
  children
}: {
  title: string;
  kicker: string;
  children: ReactNode;
}) {
  return (
    <section className="panel exec-section">
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
