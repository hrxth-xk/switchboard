import { ApplicationsPreview } from "@/components/dashboard/ApplicationsPreview";
import { LearningMapPreview } from "@/components/dashboard/LearningMapPreview";
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { requireUser } from "@/lib/auth";
import { buildRecentActivity, buildTodaysFocus, sortApplicationsByPriority } from "@/lib/dashboard-utils";
import { prisma } from "@/lib/db";
import { buildSummary } from "@/lib/summary";

export default async function DashboardPage() {
  const user = await requireUser();

  const [topics, applications, interviews, goals, notes] = await Promise.all([
    prisma.topic.findMany({ where: { userId: user.id }, orderBy: [{ category: "asc" }, { lastTouched: "desc" }] }),
    prisma.application.findMany({ where: { userId: user.id }, orderBy: [{ status: "asc" }, { company: "asc" }] }),
    prisma.interview.findMany({ where: { userId: user.id }, orderBy: { scheduledAt: "asc" } }),
    prisma.goal.findMany({ where: { userId: user.id }, orderBy: { dueDate: "asc" } }),
    prisma.note.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
  ]);

  const summary = buildSummary(topics, applications, goals);
  const now = new Date();
  const upcomingInterviews = interviews.filter((interview) => interview.scheduledAt >= now);
  const sortedApplications = sortApplicationsByPriority(applications);
  const focus = buildTodaysFocus(topics, applications, interviews, goals, now);
  const recentActivity = buildRecentActivity(topics, applications, interviews, notes);

  return (
    <>
      <TodaysFocus focus={focus} />
      <RecentActivity entries={recentActivity} />

      <OverviewStats
        dsaProgress={summary.dsaProgress}
        activeApplications={summary.activeApplications}
        upcomingInterviews={upcomingInterviews.length}
        goalProgress={summary.goalProgress}
      />

      <section className="grid columns">
        <LearningMapPreview topics={topics} />
        <ApplicationsPreview applications={sortedApplications.slice(0, 5)} />
      </section>
    </>
  );
}
