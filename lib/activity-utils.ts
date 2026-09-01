import type { Activity } from "@prisma/client";
import { formatDate, formatRelativeTime } from "@/lib/dashboard-utils";
import {
  calendarDayKey,
  detectTimeZone,
  endOfDay,
  isWithinRange,
  startOfDay,
  startOfWeek
} from "@/lib/period-utils";

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

export function mapActivityFeed(
  activities: Activity[],
  now = new Date(),
  timeZone: string = detectTimeZone()
): ActivityFeedItem[] {
  return activities.map((activity) => ({
    id: activity.id,
    title: parseActivityTitle(activity.label),
    category: classifyActivity(activity.label),
    timestamp: formatActivityTimestamp(activity.createdAt, now, timeZone),
    createdAt: activity.createdAt.toISOString()
  }));
}

/**
 * Runs server-side via mapActivityFeed, so "is this today" must be answered in
 * the caller's zone, not the runtime's.
 */
export function formatActivityTimestamp(
  date: Date,
  now = new Date(),
  timeZone: string = detectTimeZone()
) {
  if (calendarDayKey(date, timeZone) === calendarDayKey(now, timeZone)) {
    return formatRelativeTime(date, now, timeZone);
  }

  return formatDate(date, timeZone);
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
