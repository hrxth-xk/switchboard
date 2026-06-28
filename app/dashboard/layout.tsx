import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { QuickAddFab } from "@/components/DashboardClient";
import { LogoutButton } from "@/components/LogoutButton";
import { requireUser } from "@/lib/auth";
import { getUserDisplayLabel } from "@/lib/user-display";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const displayName = getUserDisplayLabel(user);

  return (
    <main className="shell">
      <div className="page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span>Switchboard</span>
          </div>
          <div className="toolbar">
            <span className="user-label">{displayName}</span>
            {user.role === "ADMIN" ? (
              <Link className="pill" href="/dashboard/admin">
                Admin
              </Link>
            ) : null}
            <LogoutButton />
          </div>
        </header>

        <DashboardNav />

        {children}
      </div>

      <QuickAddFab />
    </main>
  );
}
