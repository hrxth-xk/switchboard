import type { Activity } from "@prisma/client";
import { formatDate, formatRelativeTime } from "@/lib/dashboard-utils";
import { endOfDay, isWithinRange, startOfDay, startOfWeek } from "@/lib/period-utils";

export type ActivityCategory = "DSA" | "Applications" | "Projects" | "Notes" | "Other";

export type ActivityFeedItem = {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  timestamp: string;
  createdAt: string;
};

export type ActivityFilter = "today" | "yesterday" | "week" | "custom";

function classifyActivity(label: string): ActivityCategory {
  if (
    label.startsWith("Solved ") ||
    label.startsWith("Revisited ") ||
    label.startsWith("Updated ") ||
    label.startsWith("Added problem ")
  ) {
    return "DSA";
  }

  if (
    label.startsWith("Applied to ") ||
    label.includes(" application") ||
    label.startsWith("Moved ") ||
    label.startsWith("Uploaded resume") ||
    label.includes("wishlist")
  ) {
    return "Applications";
  }

  if (label.startsWith("Started project ") || label.startsWith("Updated project ") || label.startsWith("Completed project ")) {
    return "Projects";
  }

  if (label.startsWith("Added note ")) {
    return "Notes";
  }

  return "Other";
}

function parseActivityTitle(label: string) {
  return label;
}

export function mapActivityFeed(activities: Activity[], now = new Date()): ActivityFeedItem[] {
  return activities.map((activity) => ({
    id: activity.id,
    title: parseActivityTitle(activity.label),
    category: classifyActivity(activity.label),
    timestamp: formatActivityTimestamp(activity.createdAt, now),
    createdAt: activity.createdAt.toISOString()
  }));
}

export function formatActivityTimestamp(date: Date, now = new Date()) {
  const dayStart = startOfDay(now);
  const targetDay = startOfDay(date);

  if (targetDay.getTime() === dayStart.getTime()) {
    return formatRelativeTime(date, now);
  }

  return formatDate(date);
}

export function filterActivities(
  items: ActivityFeedItem[],
  filter: ActivityFilter,
  customDate: string | null,
  now = new Date()
) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (filter === "today") {
    return items.filter((item) => isWithinRange(new Date(item.createdAt), todayStart, todayEnd));
  }

  if (filter === "yesterday") {
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = endOfDay(yesterdayStart);
    return items.filter((item) => isWithinRange(new Date(item.createdAt), yesterdayStart, yesterdayEnd));
  }

  if (filter === "week") {
    const weekStart = startOfWeek(now);
    return items.filter((item) => isWithinRange(new Date(item.createdAt), weekStart, todayEnd));
  }

  if (filter === "custom" && customDate) {
    const customStart = startOfDay(new Date(`${customDate}T00:00:00`));
    const customEnd = endOfDay(customStart);
    return items.filter((item) => isWithinRange(new Date(item.createdAt), customStart, customEnd));
  }

  return items;
}

export function searchActivities(items: ActivityFeedItem[], query: string) {
  const value = query.trim().toLowerCase();
  if (!value) return items;

  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(value) ||
      (item.description?.toLowerCase().includes(value) ?? false) ||
      item.category.toLowerCase().includes(value)
  );
}

export function activityCategoryIcon(category: ActivityCategory) {
  switch (category) {
    case "DSA":
      return "◆";
    case "Applications":
      return "◇";
    case "Projects":
      return "▣";
    case "Notes":
      return "▤";
    default:
      return "•";
  }
}
