import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  deleteResumeFile,
  readResumeFile,
  resumeContentType,
  saveResumeFile
} from "@/lib/resume-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application?.resumeStoragePath || !application.resumeFileName) {
    return NextResponse.json({ error: "No resume on file." }, { status: 404 });
  }

  try {
    const buffer = await readResumeFile(application.resumeStoragePath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": resumeContentType(application.resumeFileName),
        "Content-Disposition": `attachment; filename="${application.resumeFileName}"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Resume file not found." }, { status: 404 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a resume file to upload." }, { status: 400 });
  }

  try {
    const oldStoragePath = application.resumeStoragePath;
    const resume = await saveResumeFile(user.id, application.id, file);

    await prisma.application.update({
      where: { id },
      data: resume
    });

    if (oldStoragePath && oldStoragePath !== resume.resumeStoragePath) {
      await deleteResumeFile(oldStoragePath);
    }

    await logActivity(user.id, `Uploaded resume for ${application.company}`);
    return NextResponse.json({ ok: true, resumeFileName: resume.resumeFileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
