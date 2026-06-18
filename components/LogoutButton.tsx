"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="icon-button secondary" onClick={logout} title="Sign out" aria-label="Sign out">
      <LogOut size={18} />
    </button>
  );
}
