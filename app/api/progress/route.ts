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
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { prisma } from "@/lib/db";
import { civilDateToZonedNoon } from "@/lib/period-utils";
import { normalizeProblemName } from "@/lib/problem-utils";
import { oneOffAttachError } from "@/lib/resume-library";
import { resolveNextReviewDate, type ReviewPreset } from "@/lib/review-schedule";
import { getRequestTimeZone } from "@/lib/timezone";

const problemSchema = z.object({
  type: z.literal("problem"),
  name: z.string().min(2, "This field is required."),
  url: z.string().url("Enter a valid URL.").optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  topic: z.string().min(2, "This field is required."),
  pattern: z.string().optional(),
  difficulty: z.string().optional().or(z.literal("")),
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
  appliedAt: z.string().optional(),
  resumeVersionId: z.string().optional().or(z.literal(""))
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
  now: Date,
  timeZone: string
) {
  return resolveNextReviewDate(
    {
      preset: data.reviewPreset as ReviewPreset | undefined,
      customDate: data.customReviewDate,
      confidence: data.reviewPreset || data.customReviewDate ? undefined : confidence
    },
    now,
    timeZone
  );
}

export async function POST(request: Request) {
  const user = await requireUser();
  const timeZone = getRequestTimeZone();
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
    const existing = await prisma.problem.findFirst({
      where: {
        userId: user.id,
        OR: [
          { name },
          ...(data.slug ? [{ slug: data.slug }] : [])
        ]
      }
    });
    const nextReview = problemNextReview(data, data.confidence, now, timeZone);

    if (existing) {
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          url: data.url || existing.url,
          slug: data.slug || existing.slug,
          topic: data.topic,
          pattern: data.pattern || null,
          difficulty: data.difficulty || existing.difficulty,
          confidence: data.confidence,
          notes: data.notes ?? existing.notes,
          lastPracticed: now,
          nextReview,
          revisitCount: existing.revisitCount + 1
        }
      });
      await logActivities(user.id, [`Revisited ${name}`, `Solved ${name}`]);
      revalidateUserDashboard(user.id);
      return NextResponse.json({ ok: true, updated: true });
    }

    await prisma.problem.create({
      data: {
        userId: user.id,
        name,
        url: data.url || null,
        slug: data.slug || null,
        topic: data.topic,
        pattern: data.pattern || null,
        difficulty: data.difficulty || null,
        confidence: data.confidence,
        notes: data.notes || null,
        lastPracticed: now,
        nextReview,
        revisitCount: 1
      }
    });

    await logActivities(user.id, [`Added problem ${name}`, `Solved ${name}`]);
    revalidateUserDashboard(user.id);
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

    // A picked day is anchored at local noon; without a date we fall back to the
    // moment of save, which is already the right instant.
    const appliedAt =
      data.appliedAt && data.status !== "WISHLIST"
        ? civilDateToZonedNoon(data.appliedAt, getRequestTimeZone())
        : ["APPLIED", "OA", "INTERVIEW", "OFFER"].includes(data.status)
          ? now
          : null;

    let resumeVersionId: string | null = null;
    if (data.resumeVersionId) {
      const resume = await prisma.resumeVersion.findFirst({
        where: { id: data.resumeVersionId, userId: user.id }
      });
      if (!resume) {
        return jsonWithFieldErrors("Selected resume was not found.", 400, {
          resumeVersionId: "Choose a resume from your library."
        });
      }
      const attachError = await oneOffAttachError(resume);
      if (attachError) {
        return jsonWithFieldErrors(attachError, 400, { resumeVersionId: attachError });
      }
      resumeVersionId = resume.id;
    }

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
        appliedAt,
        resumeVersionId
      }
    });

    if (data.status === "APPLIED" || data.status === "OA" || data.status === "INTERVIEW") {
      await logActivity(user.id, `Applied to ${data.company}`);
    } else {
      await logActivity(user.id, `Added ${data.company} to wishlist`);
    }

    revalidateUserDashboard(user.id);
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
    revalidateUserDashboard(user.id);
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
    revalidateUserDashboard(user.id);
  }

  return NextResponse.json({ ok: true });
}
