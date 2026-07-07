import { MacroDashboard } from "@/components/dashboard/macro/MacroDashboard";
import { requireUser } from "@/lib/auth";
import { buildMacroDashboard } from "@/lib/macro-dashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await buildMacroDashboard(user.id);

  return <MacroDashboard data={data} />;
}
