import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="shell shell-app shell-auth">
      <header className="auth-top-nav" aria-label="App header">
        <div className="auth-top-nav-inner">
          <Link className="auth-top-nav-brand" href="/login">
            <span className="brand-mark">S</span>
            <span>Switchboard</span>
          </Link>
        </div>
      </header>

      <div className="app-main">
        <div className="page">{children}</div>
      </div>
    </main>
  );
}
