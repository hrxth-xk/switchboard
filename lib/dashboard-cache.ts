import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { buildMacroDashboard } from "@/lib/macro-dashboard";
import { calendarDateKey } from "@/lib/period-utils";

export function dashboardCacheTag(userId: string) {
  return `dashboard-${userId}`;
}

export function getCachedMacroDashboard(userId: string) {
  const dayKey = calendarDateKey();
  return unstable_cache(
    () => buildMacroDashboard(userId, new Date()),
    ["macro-dashboard", userId, dayKey],
    {
      revalidate: 60,
      tags: [dashboardCacheTag(userId), `dashboard-day-${dayKey}`]
    }
  )();
}

export function revalidateUserDashboard(userId: string) {
  revalidateTag(dashboardCacheTag(userId));
  revalidatePath("/dashboard", "layout");
}
