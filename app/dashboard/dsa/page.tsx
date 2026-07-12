import { DsaTodayProgressSection } from "@/components/dsa/DsaTodayProgress";
import { TrackedProblems } from "@/components/dsa/TrackedProblems";
import { ReviewsDue } from "@/components/dsa/UpcomingRevisits";
import { requireUser } from "@/lib/auth";
import { DEFAULT_GOALS } from "@/lib/goals";
import { getAllProblemsSorted, serializeProblem } from "@/lib/problem-utils";
import { prisma } from "@/lib/db";

export default async function DsaPage() {
  const user = await requireUser();
  // Wide enough window that client TZ filtering still sees "today" activities
  const activitySince = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [problems, goals, activities] = await Promise.all([
    prisma.problem.findMany({
      where: { userId: user.id },
      orderBy: { lastPracticed: "desc" }
    }),
    prisma.userGoals.findUnique({ where: { userId: user.id } }),
    prisma.activity.findMany({
      where: { userId: user.id, createdAt: { gte: activitySince } },
      select: { label: true, createdAt: true }
    })
  ]);

  const dailyGoal = goals?.dailyDsaGoal ?? DEFAULT_GOALS.dailyDsaGoal;
  const serializedProblems = problems.map(serializeProblem);
  const tracked = getAllProblemsSorted(problems).map(serializeProblem);
  const activityRows = activities.map((activity) => ({
    label: activity.label,
    createdAt: activity.createdAt.toISOString()
  }));

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">DSA</h1>
        <p className="page-kicker">Stay consistent. Spaced repetition wins.</p>
      </header>

      <DsaTodayProgressSection
        activities={activityRows}
        dailyGoal={dailyGoal}
        problems={serializedProblems}
      />
      <ReviewsDue problems={serializedProblems} />
      <TrackedProblems problems={tracked} />
    </div>
  );
}
