import type { Activity } from "@prisma/client";
import { formatRelativeTime } from "@/lib/dashboard-utils";

export type ActivityItem = {
  id: string;
  label: string;
  time: string;
};

export function mapActivities(activities: Activity[], now = new Date()): ActivityItem[] {
  return activities.map((activity) => ({
    id: activity.id,
    label: activity.label,
    time: formatRelativeTime(activity.createdAt, now)
  }));
}
