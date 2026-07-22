import { BottomNav } from "@/components/dashboard/BottomNav";
import { DesktopTopNav } from "@/components/dashboard/DesktopTopNav";
import { PageTransition } from "@/components/dashboard/PageTransition";
import { RefreshOnDayChange } from "@/components/dashboard/RefreshOnDayChange";
import { QuickAddFab } from "@/components/DashboardClient";
import { requireUser } from "@/lib/auth";
import { getUserDisplayLabel } from "@/lib/user-display";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const displayName = getUserDisplayLabel(user);

  return (
    <main className="shell shell-app">
      <RefreshOnDayChange />
      <DesktopTopNav displayName={displayName} />

      <div className="app-main">
        <div className="page">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>

      <BottomNav />
      <QuickAddFab />
    </main>
  );
}
