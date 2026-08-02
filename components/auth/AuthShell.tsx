import Link from "next/link";
import type { ReactNode } from "react";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

type AuthShellProps = {
  children: ReactNode;
  /** Cross-link shown in the header, mirroring the landing nav's right-hand action. */
  action?: { href: string; label: string };
};

export function AuthShell({ children, action }: AuthShellProps) {
  return (
    <main className="shell shell-app shell-auth">
      <AmbientBackground tone="app" />

      <header className="auth-top-nav" aria-label="App header">
        <div className="auth-top-nav-inner">
          <Link className="auth-top-nav-brand" href="/">
            <span aria-hidden="true" className="brand-mark">
              S
            </span>
            <span>Switchboard</span>
          </Link>

          {action ? (
            <Link className="landing-btn landing-btn-ghost landing-btn-sm" href={action.href}>
              {action.label}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="app-main">
        <div className="page">{children}</div>
      </div>
    </main>
  );
}
