import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  nextStep: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  action: z.enum(["complete", "pause", "resume"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  }

  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = parsed.data;
  let status = body.status ?? project.status;

  if (body.action === "complete") status = "COMPLETED";
  if (body.action === "pause") status = "PAUSED";
  if (body.action === "resume") status = "ACTIVE";

  await prisma.project.update({
    where: { id },
    data: {
      title: body.title ?? project.title,
      status,
      nextStep: body.nextStep === "" ? null : body.nextStep ?? project.nextStep,
      notes: body.notes === "" ? null : body.notes ?? project.notes
    }
  });

  if (status === "COMPLETED" && project.status !== "COMPLETED") {
    await logActivity(user.id, `Completed project ${project.title}`);
  } else {
    await logActivity(user.id, `Updated project ${body.title ?? project.title}`);
  }

  return NextResponse.json({ ok: true });
}
