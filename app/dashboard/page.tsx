import { MacroDashboard } from "@/components/dashboard/macro/MacroDashboard";
import { requireUser } from "@/lib/auth";
import { getCachedMacroDashboard } from "@/lib/dashboard-cache";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getCachedMacroDashboard(user.id);

  return <MacroDashboard data={data} />;
}