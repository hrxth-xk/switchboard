import Link from "next/link";
import { ResumeLibrary } from "@/components/resumes/ResumeLibrary";
import { requireUser } from "@/lib/auth";
import { listResumeVersions, serializeResumeVersion } from "@/lib/resume-library";

export default async function ResumeLibraryPage() {
  const user = await requireUser();
  const resumes = await listResumeVersions(user.id, { includeArchived: true });

  return (
    <div className="workspace-page">
      <header className="page-header page-header-back">
        <Link className="back-link" href="/dashboard/more">
          ← Profile
        </Link>
        <h1 className="page-title">Resume Library</h1>
        <p className="page-kicker">
          Build a version library, then attach the right one when you add an application.
        </p>
      </header>

      <ResumeLibrary resumes={resumes.map(serializeResumeVersion)} />
    </div>
  );
}
