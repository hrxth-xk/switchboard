import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeResumeVersion } from "@/lib/resume-library";
import { deleteResumeFile } from "@/lib/resume-storage";

const patchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  archived: z.boolean().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid resume update." }, { status: 400 });
  }

  const resume = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const data: { name?: string; archived?: boolean } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name.trim();
  if (parsed.data.archived !== undefined) data.archived = parsed.data.archived;

  const updated = await prisma.resumeVersion.update({
    where: { id },
    data
  });

  if (parsed.data.archived === true && !resume.archived) {
    await logActivity(user.id, `Archived resume ${updated.name} v${updated.version}`);
  } else if (parsed.data.archived === false && resume.archived) {
    await logActivity(user.id, `Restored resume ${updated.name} v${updated.version}`);
  } else if (parsed.data.name && parsed.data.name !== resume.name) {
    await logActivity(user.id, `Renamed resume to ${updated.name} v${updated.version}`);
  }

  return NextResponse.json({ ok: true, resume: serializeResumeVersion(updated) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const resume = await prisma.resumeVersion.findFirst({ where: { id, userId: user.id } });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found." }, { status: 404 });
  }

  const linkedCount = await prisma.application.count({ where: { resumeVersionId: id } });
  if (linkedCount > 0) {
    // Soft-delete when still referenced — keep storage for downloads.
    const updated = await prisma.resumeVersion.update({
      where: { id },
      data: { archived: true }
    });
    await logActivity(user.id, `Archived resume ${updated.name} v${updated.version}`);
    return NextResponse.json({ ok: true, resume: serializeResumeVersion(updated), archived: true });
  }

  await prisma.resumeVersion.delete({ where: { id } });
  await deleteResumeFile(resume.storagePath);
  await logActivity(user.id, `Deleted resume ${resume.name} v${resume.version}`);
  return NextResponse.json({ ok: true, deleted: true });
}
