import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { QuickAddFab } from "@/components/DashboardClient";
import { LogoutButton } from "@/components/LogoutButton";
import { requireUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <main className="shell">
      <div className="page">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">S</span>
            <span>Switchboard</span>
          </div>
          <div className="toolbar">
            {user.role === "ADMIN" ? (
              <Link className="pill" href="/dashboard/admin">
                Admin
              </Link>
            ) : (
              <span className="pill">User</span>
            )}
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
