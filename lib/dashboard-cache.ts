import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { buildMacroDashboard } from "@/lib/macro-dashboard";
import { calendarDayKey } from "@/lib/period-utils";
import { getRequestTimeZone } from "@/lib/timezone";

export function dashboardCacheTag(userId: string) {
  return `dashboard-${userId}`;
}

export function getCachedMacroDashboard(userId: string) {
  const timeZone = getRequestTimeZone();
  const dayKey = calendarDayKey(new Date(), timeZone);
  return unstable_cache(
    () => buildMacroDashboard(userId, new Date(), timeZone),
    ["macro-dashboard", userId, dayKey, timeZone],
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
