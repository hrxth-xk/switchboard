import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const topicSchema = z.object({
  type: z.literal("topic"),
  title: z.string().min(2),
  category: z.string().min(2),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  status: z.enum(["TODO", "LEARNING", "REVISING", "MASTERED"]),
  confidence: z.coerce.number().min(1).max(5),
  solvedCount: z.coerce.number().min(0),
  targetCount: z.coerce.number().min(1),
  resourceUrl: z.string().url().optional().or(z.literal(""))
});

const applicationSchema = z.object({
  type: z.literal("application"),
  company: z.string().min(2),
  roleTitle: z.string().min(2),
  location: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["WISHLIST", "APPLIED", "OA", "INTERVIEWING", "OFFER", "REJECTED"]),
  nextStep: z.string().optional(),
  notes: z.string().optional()
});

const goalSchema = z.object({
  type: z.literal("goal"),
  title: z.string().min(2),
  metric: z.string().min(2),
  target: z.coerce.number().min(1),
  current: z.coerce.number().min(0),
  dueDate: z.string().min(4)
});

const interviewSchema = z.object({
  type: z.literal("interview"),
  company: z.string().min(2),
  round: z.string().min(2),
  scheduledAt: z.string().min(4),
  focus: z.string().min(2),
  outcome: z.string().optional()
});

const noteSchema = z.object({
  type: z.literal("note"),
  title: z.string().min(2),
  tag: z.string().min(2),
  body: z.string().min(2)
});

const schema = z.discriminatedUnion("type", [topicSchema, applicationSchema, goalSchema, interviewSchema, noteSchema]);

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the required fields and try again." }, { status: 400 });
  }

  const data = parsed.data;

  if (data.type === "topic") {
    await prisma.topic.create({
      data: {
        userId: user.id,
        title: data.title,
        category: data.category,
        difficulty: data.difficulty,
        status: data.status,
        confidence: data.confidence,
        solvedCount: data.solvedCount,
        targetCount: data.targetCount,
        resourceUrl: data.resourceUrl || null
      }
    });
  }

  if (data.type === "application") {
    await prisma.application.create({
      data: {
        userId: user.id,
        company: data.company,
        roleTitle: data.roleTitle,
        location: data.location,
        source: data.source,
        status: data.status,
        nextStep: data.nextStep,
        notes: data.notes
      }
    });
  }

  if (data.type === "goal") {
    await prisma.goal.create({
      data: {
        userId: user.id,
        title: data.title,
        metric: data.metric,
        target: data.target,
        current: data.current,
        dueDate: new Date(data.dueDate)
      }
    });
  }

  if (data.type === "interview") {
    await prisma.interview.create({
      data: {
        userId: user.id,
        company: data.company,
        round: data.round,
        scheduledAt: new Date(data.scheduledAt),
        focus: data.focus,
        outcome: data.outcome
      }
    });
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
  }

  return NextResponse.json({ ok: true });
}
