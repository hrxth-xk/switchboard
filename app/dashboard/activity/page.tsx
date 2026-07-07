import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { requireUser } from "@/lib/auth";
import { mapActivityFeed } from "@/lib/activity-utils";
import { prisma } from "@/lib/db";

export default async function ActivityPage() {
  const user = await requireUser();
  const activities = await prisma.activity.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  return (
    <div className="workspace-page">
      <header className="page-header">
        <h1 className="page-title">Activity</h1>
        <p className="page-kicker">A chronological log of everything you&apos;ve done</p>
      </header>
      <ActivityFeed items={mapActivityFeed(activities, new Date())} />
    </div>
  );
}
