import { NextResponse } from "next/server";
import { z } from "zod";
import { logActivities, logActivity } from "@/lib/activity";
import { fieldErrorsFromZod, jsonWithFieldErrors } from "@/lib/api-errors";
import {
  APPLICATION_DUPLICATE_MESSAGE,
  applicationDuplicateWhere,
  normalizeJobId
} from "@/lib/applications-utils";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeProblemName } from "@/lib/problem-utils";
import { resolveNextReviewDate, type ReviewPreset } from "@/lib/review-schedule";

const problemSchema = z.object({
  type: z.literal("problem"),
  name: z.string().min(2, "This field is required."),
  url: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  topic: z.string().min(2, "This field is required."),
  pattern: z.string().optional(),
  confidence: z.coerce.number().min(1).max(5),
  notes: z.string().optional(),
  reviewPreset: z.enum(["tomorrow", "threeDays", "oneWeek", "twoWeeks", "oneMonth"]).optional(),
  customReviewDate: z.string().optional()
});

const applicationSchema = z.object({
  type: z.literal("application"),
  company: z.string().min(2, "This field is required."),
  role: z.string().min(2, "This field is required."),
  jobId: z.string().optional(),
  jobUrl: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  location: z.string().optional(),
  status: z.enum(["WISHLIST", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"]),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
  appliedAt: z.string().optional()
});

const noteSchema = z.object({
  type: z.literal("note"),
  title: z.string().min(2, "This field is required."),
  tag: z.string().min(2, "This field is required."),
  body: z.string().min(2, "This field is required.")
});

const projectSchema = z.object({
  type: z.literal("project"),
  title: z.string().min(2, "This field is required."),
  status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).default("ACTIVE"),
  nextStep: z.string().min(2, "This field is required."),
  notes: z.string().optional()
});

const schema = z.discriminatedUnion("type", [problemSchema, applicationSchema, noteSchema, projectSchema]);

function problemNextReview(
  data: z.infer<typeof problemSchema>,
  confidence: number,
  now: Date
) {
  return resolveNextReviewDate(
    {
      preset: data.reviewPreset as ReviewPreset | undefined,
      customDate: data.customReviewDate,
      confidence: data.reviewPreset || data.customReviewDate ? undefined : confidence
    },
    now
  );
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return jsonWithFieldErrors(
      "Please correct the highlighted fields.",
      400,
      fieldErrorsFromZod(parsed.error)
    );
  }

  const data = parsed.data;
  const now = new Date();

  if (data.type === "problem") {
    const name = normalizeProblemName(data.name);
    const existing = await prisma.problem.findFirst({ where: { userId: user.id, name } });
    const nextReview = problemNextReview(data, data.confidence, now);

    if (existing) {
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          url: data.url || existing.url,
          topic: data.topic,
          pattern: data.pattern || null,
          confidence: data.confidence,
          notes: data.notes ?? existing.notes,
          lastPracticed: now,
          nextReview,
          revisitCount: existing.revisitCount + 1
        }
      });
      await logActivities(user.id, [`Revisited ${name}`, `Solved ${name}`]);
      return NextResponse.json({ ok: true, updated: true });
    }

    await prisma.problem.create({
      data: {
        userId: user.id,
        name,
        url: data.url || null,
        topic: data.topic,
        pattern: data.pattern || null,
        confidence: data.confidence,
        notes: data.notes || null,
        lastPracticed: now,
        nextReview,
        revisitCount: 1
      }
    });

    await logActivities(user.id, [`Added problem ${name}`, `Solved ${name}`]);
  }

  if (data.type === "application") {
    const jobId = normalizeJobId(data.jobId);
    const duplicate = await prisma.application.findFirst({
      where: applicationDuplicateWhere(user.id, data.company, data.role, jobId)
    });

    if (duplicate) {
      return jsonWithFieldErrors("Application already exists.", 409, {
        jobId: APPLICATION_DUPLICATE_MESSAGE
      });
    }

    const appliedAt =
      data.appliedAt && data.status !== "WISHLIST"
        ? new Date(data.appliedAt)
        : ["APPLIED", "OA", "INTERVIEW", "OFFER"].includes(data.status)
          ? now
          : null;

    const application = await prisma.application.create({
      data: {
        userId: user.id,
        company: data.company,
        role: data.role,
        jobId,
        jobUrl: data.jobUrl || null,
        location: data.location || null,
        status: data.status,
        nextAction: data.nextAction || null,
        notes: data.notes || null,
        appliedAt
      }
    });

    if (data.status === "APPLIED" || data.status === "OA" || data.status === "INTERVIEW") {
      await logActivity(user.id, `Applied to ${data.company}`);
    } else {
      await logActivity(user.id, `Added ${data.company} to wishlist`);
    }

    return NextResponse.json({ ok: true, applicationId: application.id });
  }

  if (data.type === "note") {
    await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title,
        tag: data.tag,
        body: data.body
      }
    });
    await logActivity(user.id, `Added note ${data.title}`);
  }

  if (data.type === "project") {
    await prisma.project.create({
      data: {
        userId: user.id,
        title: data.title,
        nextStep: data.nextStep,
        notes: data.notes || null,
        status: data.status
      }
    });
    await logActivity(user.id, `Started project ${data.title}`);
  }

  return NextResponse.json({ ok: true });
}
