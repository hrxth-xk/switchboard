import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import {
  createResumeVersion,
  listResumeVersions,
  serializeResumeVersion
} from "@/lib/resume-library";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";

  const resumes = await listResumeVersions(user.id, { includeArchived });
  return NextResponse.json({ resumes: resumes.map(serializeResumeVersion) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const formData = await request.formData();
  const file = formData.get("file");
  const name = typeof formData.get("name") === "string" ? String(formData.get("name")) : undefined;
  const oneOff = formData.get("oneOff") === "1";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a resume file to upload." }, { status: 400 });
  }

  try {
    const resume = await createResumeVersion(user.id, file, name, { oneOff });
    if (!resume.oneOff) {
      await logActivity(user.id, `Uploaded resume ${resume.name} v${resume.version}`);
    }
    return NextResponse.json({ ok: true, resume: serializeResumeVersion(resume) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
