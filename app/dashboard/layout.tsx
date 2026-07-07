import { BottomNav } from "@/components/dashboard/BottomNav";
import { DesktopTopNav } from "@/components/dashboard/DesktopTopNav";
import { QuickAddFab } from "@/components/DashboardClient";
import { requireUser } from "@/lib/auth";
import { getUserDisplayLabel } from "@/lib/user-display";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const displayName = getUserDisplayLabel(user);

  return (
    <main className="shell shell-app">
      <DesktopTopNav displayName={displayName} />

      <div className="app-main">
        <div className="page">{children}</div>
      </div>

      <BottomNav />
      <QuickAddFab />
    </main>
  );
}
