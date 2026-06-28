import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeProblemName } from "@/lib/problem-utils";
import { resolveNextReviewDate, type ReviewPreset } from "@/lib/review-schedule";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url().optional().or(z.literal("")),
  topic: z.string().min(2).optional(),
  pattern: z.string().optional().or(z.literal("")),
  confidence: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional().or(z.literal("")),
  lastPracticed: z.string().optional(),
  nextReview: z.string().optional(),
  revisitCount: z.coerce.number().min(1).optional(),
  reviewPreset: z.enum(["tomorrow", "threeDays", "oneWeek", "twoWeeks", "oneMonth"]).optional(),
  customReviewDate: z.string().optional(),
  action: z.enum(["revisit"]).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the fields and try again." }, { status: 400 });
  }

  const problem = await prisma.problem.findFirst({ where: { id, userId: user.id } });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  const body = parsed.data;
  const now = new Date();
  const confidence = body.confidence ?? problem.confidence;
  const isRevisit = body.action === "revisit";

  let nextReview = problem.nextReview;
  if (body.nextReview) {
    nextReview = new Date(body.nextReview);
  } else if (body.reviewPreset || body.customReviewDate || isRevisit || body.confidence) {
    nextReview = resolveNextReviewDate(
      {
        preset: body.reviewPreset as ReviewPreset | undefined,
        customDate: body.customReviewDate,
        confidence: body.reviewPreset || body.customReviewDate ? undefined : confidence
      },
      now
    );
  }

  const nextName = body.name ? normalizeProblemName(body.name) : problem.name;
  if (nextName !== problem.name) {
    const duplicate = await prisma.problem.findFirst({
      where: { userId: user.id, name: nextName, NOT: { id: problem.id } }
    });
    if (duplicate) {
      return NextResponse.json({ error: "Another problem already uses that name." }, { status: 409 });
    }
  }

  await prisma.problem.update({
    where: { id },
    data: {
      name: nextName,
      url: body.url === "" ? null : body.url ?? problem.url,
      topic: body.topic ?? problem.topic,
      pattern: body.pattern === "" ? null : body.pattern ?? problem.pattern,
      confidence,
      notes: body.notes === "" ? null : body.notes ?? problem.notes,
      lastPracticed: isRevisit ? now : body.lastPracticed ? new Date(body.lastPracticed) : problem.lastPracticed,
      nextReview,
      revisitCount: isRevisit ? problem.revisitCount + 1 : body.revisitCount ?? problem.revisitCount
    }
  });

  await logActivity(user.id, isRevisit ? `Revisited ${nextName}` : `Updated ${nextName}`);
  return NextResponse.json({ ok: true });
}
