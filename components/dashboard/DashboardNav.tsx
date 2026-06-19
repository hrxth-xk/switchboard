"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/dashboard" },
  { label: "DSA", href: "/dashboard/dsa" },
  { label: "Applications", href: "/dashboard/applications" },
  { label: "Interviews", href: "/dashboard/interviews" },
  { label: "Notes", href: "/dashboard/notes" }
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="nav-tabs" aria-label="Dashboard sections">
      {tabs.map((tab) => (
        <Link key={tab.href} className={`nav-tab${isActive(pathname, tab.href) ? " active" : ""}`} href={tab.href}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
