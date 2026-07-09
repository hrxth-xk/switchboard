"use client";

import Link from "next/link";

type DesktopTopNavProps = {
  displayName: string;
};

export function DesktopTopNav({ displayName }: DesktopTopNavProps) {
  return (
    <header className="desktop-top-nav" aria-label="App header">
      <div className="desktop-top-nav-inner">
        <Link className="desktop-top-nav-brand" href="/dashboard">
          <span className="brand-mark">S</span>
          <span>Switchboard</span>
        </Link>

        <Link className="desktop-top-nav-profile" href="/dashboard/more">
          {displayName}
        </Link>
      </div>
    </header>
  );
}
