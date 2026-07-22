import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function ImportDataPage() {
  await requireUser();

  return (
    <div className="workspace-page">
      <header className="page-header page-header-back">
        <Link className="back-link" href="/dashboard/more">
          ← Profile
        </Link>
        <h1 className="page-title">Import Data</h1>
        <p className="page-kicker">Bring existing progress into Switchboard without re-entering everything.</p>
      </header>

      <div className="more-actions import-sources">
        <Link className="more-link" href="/dashboard/import/leetcode">
          LeetCode
        </Link>
      </div>
    </div>
  );
}
