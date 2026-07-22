"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, UserRound } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";
  const onProfile =
    pathname === "/dashboard/more" ||
    pathname === "/dashboard/goals" ||
    pathname === "/dashboard/admin" ||
    pathname === "/dashboard/import" ||
    pathname.startsWith("/dashboard/import/") ||
    pathname === "/dashboard/resumes" ||
    pathname.startsWith("/dashboard/resumes/");

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <Link href="/dashboard" className={`bottom-nav-item${onDashboard ? " active" : ""}`} prefetch={false}>
        <LayoutGrid size={20} />
        <span>Dashboard</span>
      </Link>

      <div className="bottom-nav-fab-slot" aria-hidden="true" />

      <Link href="/dashboard/more" className={`bottom-nav-item${onProfile ? " active" : ""}`} prefetch={false}>
        <UserRound size={20} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}
