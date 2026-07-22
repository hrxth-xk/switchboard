import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createResumeVersion, resumeVersionLabel } from "@/lib/resume-library";
import { readResumeFile, resumeContentType } from "@/lib/resume-storage";

function safeContentDisposition(fileName: string) {
  const sanitized = fileName.replace(/["\r\n]/g, "_");
  return `attachment; filename="${sanitized}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { resumeVersion: true }
  });

  if (!application?.resumeVersion) {
    return NextResponse.json({ error: "No resume on file." }, { status: 404 });
  }

  const resume = application.resumeVersion;
  if (resume.storagePath === "pending") {
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }

  try {
    const buffer = await readResumeFile(resume.storagePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": resumeContentType(resume.originalFileName),
        "Content-Disposition": safeContentDisposition(resume.originalFileName)
      }
    });
  } catch {
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }
}

/** Upload a new library resume and attach it to this application. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")) : undefined;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a resume file to upload." }, { status: 400 });
  }

  try {
    const resume = await createResumeVersion(user.id, file, name);
    await prisma.application.update({
      where: { id },
      data: { resumeVersionId: resume.id }
    });

    await logActivity(user.id, `Linked ${resumeVersionLabel(resume)} to ${application.company}`);
    return NextResponse.json({
      ok: true,
      resumeVersionId: resume.id,
      resumeLabel: resumeVersionLabel(resume)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/** Unlink the resume from this application (library file is kept). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: { resumeVersion: true }
  });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (!application.resumeVersionId) {
    return NextResponse.json({ ok: true });
  }

  await prisma.application.update({
    where: { id },
    data: { resumeVersionId: null }
  });

  await logActivity(user.id, `Unlinked resume from ${application.company}`);
  return NextResponse.json({ ok: true });
}
