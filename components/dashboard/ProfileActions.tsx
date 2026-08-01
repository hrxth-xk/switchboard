"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type ProfileActionsProps = {
  displayName: string;
  email: string;
  isAdmin: boolean;
};

export function ProfileActions({ displayName, email, isAdmin }: ProfileActionsProps) {
  return (
    <div className="more-page">
      <div className="more-profile">
        <p className="more-name">{displayName}</p>
        <p className="more-email">{email}</p>
      </div>

      <div className="more-actions">
        <Link className="more-link" href="/dashboard/resumes">
          Resume Library
        </Link>
        <Link className="more-link" href="/dashboard/import">
          Import Data
        </Link>
        <Link className="more-link" href="/dashboard/goals">
          Goal settings
        </Link>
        <Link className="more-link" href="/dashboard/password">
          Change password
        </Link>
        {isAdmin ? (
          <Link className="more-link" href="/dashboard/admin">
            Admin
          </Link>
        ) : null}
      </div>

      <div className="more-footer">
        <LogoutButton />
      </div>
    </div>
  );
}
