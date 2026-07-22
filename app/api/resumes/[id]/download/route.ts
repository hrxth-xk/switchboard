import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readResumeFile, resumeContentType } from "@/lib/resume-storage";

function safeContentDisposition(fileName: string) {
  const sanitized = fileName.replace(/["\r\n]/g, "_");
  return `attachment; filename="${sanitized}"`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const resume = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!resume || resume.storagePath === "pending") {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
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
