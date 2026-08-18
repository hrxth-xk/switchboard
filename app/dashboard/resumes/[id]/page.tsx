import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { ResumeApplications } from "@/components/resumes/ResumeApplications";
import { requireUser } from "@/lib/auth";
import { getResumeVersionWithApplications } from "@/lib/resume-library";
import { canViewInline, formatResumeUploadedAt } from "@/lib/resume-utils";

type ResumeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const resume = await getResumeVersionWithApplications(user.id, id);

  // One-offs are not library versions — they live on their application's page only.
  if (!resume || resume.oneOff) {
    notFound();
  }

  const uploadedLabel = formatResumeUploadedAt(resume.createdAt);

  return (
    <div className="workspace-page">
      <header className="page-header page-header-back">
        <Link className="back-link" href="/dashboard/resumes">
          ← Resume Library
        </Link>
        <h1 className="page-title">{resume.name}</h1>
        <p className="page-kicker">
          v{resume.version}
          {uploadedLabel ? ` · Uploaded ${uploadedLabel}` : ""}
          {resume.archived ? " · Archived" : ""}
        </p>
      </header>

      <div className="detail-panel">
        <div className="detail-resume-card">
          <div>
            <p className="detail-resume-title">{resume.originalFileName}</p>
            <p className="detail-resume-meta">
              {resume.applications.length === 1
                ? "Used in 1 application"
                : `Used in ${resume.applications.length} applications`}
            </p>
          </div>
          <div className="detail-resume-actions">
            {/* `download` is what routes iOS Safari to its Downloads manager — the
                Content-Disposition header alone just opens the PDF viewer there. */}
            <a
              className="button secondary compact"
              download={resume.originalFileName}
              href={`/api/resumes/${resume.id}/download`}
            >
              <Download size={16} />
              Download
            </a>
            {canViewInline(resume.originalFileName) ? (
              <a
                className="button secondary compact"
                href={`/api/resumes/${resume.id}/download?inline=1`}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={16} />
                Open
              </a>
            ) : null}
          </div>
        </div>

        <ResumeApplications applications={resume.applications} />
      </div>
    </div>
  );
}
