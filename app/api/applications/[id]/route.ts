import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  company: z.string().min(2).optional(),
  role: z.string().min(2).optional(),
  jobId: z.string().optional().or(z.literal("")),
  jobUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  status: z.enum(["WISHLIST", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  nextAction: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  appliedAt: z.string().optional().or(z.literal(""))
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  }

  const application = await prisma.application.findFirst({ where: { id, userId: user.id } });
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  const body = parsed.data;
  const company = body.company ?? application.company;
  const role = body.role ?? application.role;

  if (company !== application.company || role !== application.role) {
    const duplicate = await prisma.application.findFirst({
      where: { userId: user.id, company, role, NOT: { id: application.id } }
    });
    if (duplicate) {
      return NextResponse.json({ error: "An application for that company and role already exists." }, { status: 409 });
    }
  }

  const status = body.status ?? application.status;
  const now = new Date();
  let appliedAt = application.appliedAt;

  if (body.appliedAt) {
    appliedAt = new Date(body.appliedAt);
  } else if (body.appliedAt === "") {
    appliedAt = null;
  } else if (status !== "WISHLIST" && !appliedAt && status !== application.status) {
    appliedAt = now;
  }

  await prisma.application.update({
    where: { id },
    data: {
      company,
      role,
      jobId: body.jobId === "" ? null : body.jobId ?? application.jobId,
      jobUrl: body.jobUrl === "" ? null : body.jobUrl ?? application.jobUrl,
      location: body.location === "" ? null : body.location ?? application.location,
      status,
      nextAction: body.nextAction === "" ? null : body.nextAction ?? application.nextAction,
      notes: body.notes === "" ? null : body.notes ?? application.notes,
      appliedAt
    }
  });

  if (status !== application.status) {
    await logActivity(user.id, `Moved ${company} to ${status}`);
  } else {
    await logActivity(user.id, `Updated ${application.company} application`);
  }

  return NextResponse.json({ ok: true });
}
