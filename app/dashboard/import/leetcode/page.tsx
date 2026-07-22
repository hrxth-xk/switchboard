import Link from "next/link";
import { LeetCodeHistoryImport } from "@/components/import/LeetCodeHistoryImport";
import { requireUser } from "@/lib/auth";

export default async function LeetCodeImportPage() {
  await requireUser();

  return (
    <div className="workspace-page">
      <header className="page-header page-header-back">
        <Link className="back-link" href="/dashboard/import">
          ← Import Data
        </Link>
        <h1 className="page-title">Import LeetCode History</h1>
        <p className="page-kicker">
          Pull solved problems into your DSA tracker. Confidence starts as Unknown — fill it in as you review.
        </p>
      </header>

      <LeetCodeHistoryImport />
    </div>
  );
}
