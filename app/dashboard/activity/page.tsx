import { ActivitySection } from "@/components/dashboard/command/ActivitySection";
import { requireUser } from "@/lib/auth";
import { mapActivities } from "@/lib/activity-utils";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  const user = await requireUser();
  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Activity</h1>
        <p className="page-kicker">History of moves across problems, applications, and projects</p>
      </header>
      <ActivitySection items={mapActivities(activities, new Date())} />
    </div>
  );
}
