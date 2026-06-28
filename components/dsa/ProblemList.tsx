"use client";

import { useMemo, useState } from "react";
import { ProblemEditor } from "@/components/dsa/ProblemEditor";
import { formatShortDate, type ProblemRow } from "@/lib/problem-utils";

type ProblemListProps = {
  problems: ProblemRow[];
};

export function ProblemList({ problems }: ProblemListProps) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProblemRow | null>(null);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return problems;
    return problems.filter(
      (problem) =>
        problem.name.toLowerCase().includes(value) ||
        problem.topic.toLowerCase().includes(value) ||
        (problem.pattern?.toLowerCase().includes(value) ?? false)
    );
  }, [problems, query]);

  return (
    <>
      <section className="section-block">
        <header className="section-header section-header-row">
          <div>
            <h2 className="section-title">All problems</h2>
            <p className="section-kicker">{problems.length} logged</p>
          </div>
          <input
            className="table-search"
            placeholder="Search…"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </header>

        {filtered.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Topic</th>
                  <th>Pattern</th>
                  <th>Conf</th>
                  <th>Last practiced</th>
                  <th>Next review</th>
                  <th>Revisits</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((problem) => (
                  <tr className="data-table-row" key={problem.id} onClick={() => setEditing(problem)}>
                    <td className="data-table-strong">{problem.name}</td>
                    <td>{problem.topic}</td>
                    <td>{problem.pattern ?? "—"}</td>
                    <td>{problem.confidence}</td>
                    <td>{formatShortDate(problem.lastPracticed)}</td>
                    <td>{problem.nextReview ? formatShortDate(problem.nextReview) : "—"}</td>
                    <td>{problem.revisitCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-inline">
            {problems.length ? "No problems match that search." : "Log your first problem with Quick Add."}
          </p>
        )}
      </section>

      {editing ? <ProblemEditor problem={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}
