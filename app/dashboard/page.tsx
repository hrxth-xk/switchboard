import type { ReactNode } from "react";
import { BarChart3, BriefcaseBusiness, CheckCircle2, Flame, Shield } from "lucide-react";
import { AdminPanel } from "@/components/AdminPanel";
import { LogoutButton } from "@/components/LogoutButton";
import { QuickAdd } from "@/components/DashboardClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildSummary, percent } from "@/lib/summary";

export default async function DashboardPage() {
  const user = await requireUser();

  const [topics, applications, interviews, goals, notes, users] = await Promise.all([
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: [{ category: "asc" }, { lastTouched: "desc" }] }),
    prisma.application.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { company: "asc" }] }),
    prisma.interview.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "asc" }, take: 5 }),
    prisma.goal.findMany({ where: { userId: user.id }, orderBy: { dueDate: "asc" } }),
    prisma.note.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
    user.role === "ADMIN"
      ? prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true } })
      : Promise.resolve([])
  ]);

  const summary = buildSummary(topics, applications, goals);

  return (
    <main className="shell">
      <div className="page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span>Switchboard</span>
          </div>
          <div className="toolbar">
            <span className="pill">{user.role === "ADMIN" ? "Admin" : "User"}</span>
            <LogoutButton />
          </div>
        </header>

        <section className="hero">
          <div className="headline">
            <p className="eyebrow">SDE 1 job switch tracker</p>
            <h1>Good prep compounds when you can see it.</h1>
            <p className="subhead">
              Welcome back, {user.name}. Keep your daily effort tied to outcomes: topics learned, companies moved,
              interviews prepared, and goals shipped.
            </p>
          </div>
          <QuickAdd />
        </section>

        <section className="grid stats">
          <Stat label="DSA progress" value={`${summary.dsaProgress}%`} meta={`${summary.solved}/${summary.target} problems`} icon={<BarChart3 size={18} />} />
          <Stat label="Mastered" value={summary.mastered.toString()} meta={`${topics.length} tracked topics`} icon={<CheckCircle2 size={18} />} />
          <Stat label="Active pipeline" value={summary.activeApplications.toString()} meta={`${applications.length} total roles`} icon={<BriefcaseBusiness size={18} />} />
          <Stat label="Goal health" value={`${summary.goalProgress}%`} meta={`${goals.length} goals this cycle`} icon={<Flame size={18} />} />
        </section>

        <section className="grid columns">
          <Panel title="Learning map" kicker="DSA and system design readiness">
            {topics.length ? (
              <div className="list">
                {topics.map((topic) => (
                  <div className="item" key={topic.id}>
                    <div className="item-row">
                      <div>
                        <p className="item-title">{topic.title}</p>
                        <p className="item-meta">
                          {topic.category} · confidence {topic.confidence}/5
                        </p>
                      </div>
                      <span className="pill">{topic.status}</span>
                    </div>
                    <div className="progress" aria-label={`${topic.title} progress`}>
                      <span style={{ width: `${percent(topic.solvedCount, topic.targetCount)}%` }} />
                    </div>
                    <p className="item-meta">
                      {topic.solvedCount}/{topic.targetCount} reps · {topic.difficulty.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Add your first topic from Quick add." />
            )}
          </Panel>

          <Panel title="Applications" kicker="Roles, status, and next action">
            {applications.length ? (
              <div className="list">
                {applications.map((application) => (
                  <div className="item" key={application.id}>
                    <div className="item-row">
                      <div>
                        <p className="item-title">{application.company}</p>
                        <p className="item-meta">
                          {application.roleTitle}
                          {application.location ? ` · ${application.location}` : ""}
                        </p>
                      </div>
                      <span className="pill">{application.status}</span>
                    </div>
                    {application.nextStep ? <p className="item-meta">Next: {application.nextStep}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Add companies you want to pursue." />
            )}
          </Panel>

          <Panel title="Interviews" kicker="Upcoming rounds and focus areas">
            {interviews.length ? (
              <div className="list">
                {interviews.map((interview) => (
                  <div className="item" key={interview.id}>
                    <div className="item-row">
                      <div>
                        <p className="item-title">{interview.company}</p>
                        <p className="item-meta">{interview.round}</p>
                      </div>
                      <span className="pill">{formatDate(interview.scheduledAt)}</span>
                    </div>
                    <p className="item-meta">{interview.focus}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Schedule or log interview rounds." />
            )}
          </Panel>

          <Panel title="Goals and notes" kicker="Weekly commitments plus useful memory">
            <div className="list">
              {goals.map((goal) => (
                <div className="item" key={goal.id}>
                  <div className="item-row">
                    <div>
                      <p className="item-title">{goal.title}</p>
                      <p className="item-meta">
                        {goal.current}/{goal.target} {goal.metric} by {formatDate(goal.dueDate)}
                      </p>
                    </div>
                    <span className="pill">{percent(goal.current, goal.target)}%</span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${percent(goal.current, goal.target)}%` }} />
                  </div>
                </div>
              ))}
              {notes.map((note) => (
                <div className="item" key={note.id}>
                  <div className="item-row">
                    <p className="item-title">{note.title}</p>
                    <span className="pill">{note.tag}</span>
                  </div>
                  <p className="item-meta">{note.body}</p>
                </div>
              ))}
              {!goals.length && !notes.length ? <EmptyState text="Add goals or notes to keep momentum visible." /> : null}
            </div>
          </Panel>
        </section>

        {user.role === "ADMIN" ? (
          <div style={{ marginTop: 14 }}>
            <AdminPanel users={users} />
          </div>
        ) : (
          <section className="panel" style={{ marginTop: 14 }}>
            <div className="panel-header" style={{ marginBottom: 0 }}>
              <div>
                <h2 className="panel-title">Access</h2>
                <p className="panel-kicker">Your account is scoped to your own progress data.</p>
              </div>
              <Shield size={18} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, meta, icon }: { label: string; value: string; meta: string; icon: ReactNode }) {
  return (
    <article className="card stat">
      <div className="item-row">
        <p className="stat-label">{label}</p>
        {icon}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-meta">{meta}</p>
    </article>
  );
}

function Panel({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
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

function EmptyState({ text }: { text: string }) {
  return <p className="item-meta">{text}</p>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
