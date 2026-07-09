import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { buildMacroDashboard } from "@/lib/macro-dashboard";

export function dashboardCacheTag(userId: string) {
  return `dashboard-${userId}`;
}

export function getCachedMacroDashboard(userId: string) {
  return unstable_cache(() => buildMacroDashboard(userId), ["macro-dashboard", userId], {
    revalidate: 60,
    tags: [dashboardCacheTag(userId)]
  })();
}

export function revalidateUserDashboard(userId: string) {
  revalidateTag(dashboardCacheTag(userId));
  revalidatePath("/dashboard", "layout");
}
