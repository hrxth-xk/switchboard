import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { fieldErrorsFromZod, jsonWithFieldErrors } from "@/lib/api-errors";
import {
  APPLICATION_DUPLICATE_MESSAGE,
  applicationDuplicateWhere,
  normalizeJobId
} from "@/lib/applications-utils";
import { requireUser } from "@/lib/auth";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { prisma } from "@/lib/db";
import { deleteOneOffResume, oneOffAttachError } from "@/lib/resume-library";

const updateSchema = z.object({
  company: z.string().min(2, "This field is required.").optional(),
  role: z.string().min(2, "This field is required.").optional(),
  jobId: z.string().optional().or(z.literal("")),
  jobUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  status: z.enum(["WISHLIST", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  nextAction: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  appliedAt: z.string().optional().or(z.literal("")),
  resumeVersionId: z.string().nullable().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return jsonWithFieldErrors(
      "Please correct the highlighted fields.",
      400,
      fieldErrorsFromZod(parsed.error)
    );
  }

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const body = parsed.data;
  const company = body.company ?? application.company;
  const role = body.role ?? application.role;
  const jobId =
    body.jobId === "" ? null : body.jobId !== undefined ? normalizeJobId(body.jobId) : application.jobId;

  const identityChanged =
    company !== application.company ||
    role !== application.role ||
    normalizeJobId(jobId) !== normalizeJobId(application.jobId);

  if (identityChanged) {
    const duplicate = await prisma.application.findFirst({
      where: applicationDuplicateWhere(user.id, company, role, jobId, application.id)
    });
    if (duplicate) {
      return jsonWithFieldErrors("Application already exists.", 409, {
        jobId: APPLICATION_DUPLICATE_MESSAGE
      });
    }
  }

  const status = body.status ?? application.status;
  const now = new Date();
  let appliedAt = application.appliedAt;

  if (body.appliedAt) {
    appliedAt = new Date(body.appliedAt);
  } else if (body.appliedAt === "") {
    appliedAt = null;
  } else   if (status !== "WISHLIST" && !appliedAt && status !== application.status) {
    appliedAt = now;
  }

  let resumeVersionId = application.resumeVersionId;
  if (body.resumeVersionId !== undefined) {
    if (body.resumeVersionId === null || body.resumeVersionId === "") {
      resumeVersionId = null;
    } else {
      const resume = await prisma.resumeVersion.findFirst({
        where: { id: body.resumeVersionId, userId: user.id }
      });
      if (!resume) {
        return jsonWithFieldErrors("Selected resume was not found.", 400, {
          resumeVersionId: "Choose a resume from your library."
        });
      }
      const attachError = await oneOffAttachError(resume, application.id);
      if (attachError) {
        return jsonWithFieldErrors(attachError, 400, { resumeVersionId: attachError });
      }
      resumeVersionId = resume.id;
    }
  }

  // A one-off has no life outside the application it was uploaded for.
  const droppedOneOffId =
    application.resumeVersionId && application.resumeVersionId !== resumeVersionId
      ? application.resumeVersionId
      : null;

  await prisma.application.update({
    where: { id },
    data: {
      company,
      role,
      jobId,
      jobUrl: body.jobUrl === "" ? null : body.jobUrl ?? application.jobUrl,
      location: body.location === "" ? null : body.location ?? application.location,
      status,
      nextAction: body.nextAction === "" ? null : body.nextAction ?? application.nextAction,
      notes: body.notes === "" ? null : body.notes ?? application.notes,
      appliedAt,
      resumeVersionId
    }
  });

  await deleteOneOffResume(droppedOneOffId);

  if (status !== application.status) {
    await logActivity(user.id, `Moved ${company} to ${status}`);
  } else {
    await logActivity(user.id, `Updated ${application.company} application`);
  }

  revalidateUserDashboard(user.id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  await prisma.application.delete({ where: { id } });
  // The FK is SetNull, so an attached one-off would otherwise be left unreachable.
  await deleteOneOffResume(application.resumeVersionId);
  await logActivity(user.id, `Deleted application - ${application.company}`);
  revalidateUserDashboard(user.id);
  return NextResponse.json({ ok: true });
}
