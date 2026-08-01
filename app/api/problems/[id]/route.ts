import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteLatestActivity, logActivity } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { prisma } from "@/lib/db";
import { normalizeProblemName } from "@/lib/problem-utils";
import { resolveNextReviewDate, type ReviewPreset } from "@/lib/review-schedule";
import { getRequestTimeZone } from "@/lib/timezone";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  url: z.string().url().optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  topic: z.string().min(2).optional(),
  pattern: z.string().optional().or(z.literal("")),
  difficulty: z.string().optional().or(z.literal("")),
  confidence: z.coerce.number().min(1).max(5).optional(),
  notes: z.string().optional().or(z.literal("")),
  lastPracticed: z.string().optional(),
  nextReview: z.string().optional(),
  revisitCount: z.coerce.number().min(1).optional(),
  reviewPreset: z.enum(["tomorrow", "threeDays", "oneWeek", "twoWeeks", "oneMonth"]).optional(),
  customReviewDate: z.string().optional(),
  action: z.enum(["revisit", "undo-revisit"]).optional()
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
  const timeZone = getRequestTimeZone();
  const confidence = body.confidence ?? problem.confidence;
  const isRevisit = body.action === "revisit";

  // Undo replays the newest history row verbatim, so it returns before the
  // schedule resolution below — that block would recompute nextReview from the
  // restored confidence, and `nextReview` alone cannot express "back to
  // unscheduled". The values come from the database, never from the client, so
  // the button still works after a reload or on another device.
  if (body.action === "undo-revisit") {
    const previous = await prisma.problemRevisit.findFirst({
      where: { problemId: problem.id },
      orderBy: { reviewedAt: "desc" }
    });

    if (!previous) {
      return NextResponse.json({ error: "There's no revisit to undo." }, { status: 400 });
    }

    // The revisit set lastPracticed to reviewedAt; anything else means the
    // problem was edited since, and rewinding would clobber that edit.
    if (problem.lastPracticed.getTime() !== previous.reviewedAt.getTime()) {
      return NextResponse.json(
        { error: "This problem changed since that revisit, so nothing was undone." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.problem.update({
        where: { id },
        data: {
          lastPracticed: previous.prevLastPracticed,
          nextReview: previous.prevNextReview,
          revisitCount: previous.prevRevisitCount,
          confidence: previous.prevConfidence
        }
      }),
      prisma.problemRevisit.delete({ where: { id: previous.id } })
    ]);

    // Drop the activity row too, or streaks keep counting a revisit that was undone.
    await deleteLatestActivity(user.id, `Revisited ${problem.name}`);
    revalidateUserDashboard(user.id);

    return NextResponse.json({
      ok: true,
      nextReview: previous.prevNextReview?.toISOString() ?? null,
      confidence: previous.prevConfidence
    });
  }

  let nextReview = problem.nextReview;
  if (body.nextReview) {
    nextReview = new Date(body.nextReview);
  } else if (body.reviewPreset || body.customReviewDate || isRevisit || body.confidence) {
    nextReview = resolveNextReviewDate(
      {
        preset: body.reviewPreset as ReviewPreset | undefined,
        customDate: body.customReviewDate,
        confidence:
          body.reviewPreset || body.customReviewDate
            ? undefined
            : confidence ?? undefined
      },
      now,
      timeZone
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
      slug: body.slug === "" ? null : body.slug ?? problem.slug,
      topic: body.topic ?? problem.topic,
      pattern: body.pattern === "" ? null : body.pattern ?? problem.pattern,
      difficulty: body.difficulty === "" ? null : body.difficulty ?? problem.difficulty,
      confidence: body.confidence ?? problem.confidence,
      notes: body.notes === "" ? null : body.notes ?? problem.notes,
      lastPracticed: isRevisit ? now : body.lastPracticed ? new Date(body.lastPracticed) : problem.lastPracticed,
      nextReview,
      revisitCount: isRevisit ? problem.revisitCount + 1 : body.revisitCount ?? problem.revisitCount
    }
  });

  // Record what this revisit replaced so it can be undone later.
  if (isRevisit) {
    await prisma.problemRevisit.create({
      data: {
        problemId: problem.id,
        reviewedAt: now,
        prevLastPracticed: problem.lastPracticed,
        prevNextReview: problem.nextReview,
        prevRevisitCount: problem.revisitCount,
        prevConfidence: problem.confidence
      }
    });
  }

  await logActivity(user.id, isRevisit ? `Revisited ${nextName}` : `Updated ${nextName}`);
  revalidateUserDashboard(user.id);
  return NextResponse.json({
    ok: true,
    nextReview: nextReview?.toISOString() ?? null,
    confidence: body.confidence ?? problem.confidence,
    ...(isRevisit ? { canUndo: true } : {})
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const problem = await prisma.problem.findFirst({ where: { id, userId: user.id } });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found." }, { status: 404 });
  }

  await prisma.problem.delete({ where: { id } });
  await logActivity(user.id, `Deleted DSA problem - ${problem.name}`);
  revalidateUserDashboard(user.id);
  return NextResponse.json({ ok: true });
}

