import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { revalidateUserDashboard } from "@/lib/dashboard-cache";
import { prisma } from "@/lib/db";
import { serializeGoals } from "@/lib/goals";

const goalsSchema = z.object({
  dailyDsaGoal: z.coerce.number().int().min(1).max(20),
  dailyApplicationsGoal: z.coerce.number().int().min(0).max(20),
  dailyProjectSessionsGoal: z.coerce.number().int().min(0).max(20)
});

export async function GET() {
  const user = await requireUser();
  const goals = await prisma.userGoals.findUnique({ where: { userId: user.id } });
  return NextResponse.json({ goals: serializeGoals(goals) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const parsed = goalsSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter valid daily goals." }, { status: 400 });
  }

  const existing = await prisma.userGoals.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "Goals already exist. Use PATCH to update." }, { status: 409 });
  }

  const goals = await prisma.userGoals.create({
    data: { userId: user.id, ...parsed.data }
  });

  revalidateUserDashboard(user.id);
  return NextResponse.json({ goals: serializeGoals(goals) });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  const parsed = goalsSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter valid daily goals." }, { status: 400 });
  }

  const goals = await prisma.userGoals.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...parsed.data },
    update: parsed.data
  });

  revalidateUserDashboard(user.id);
  return NextResponse.json({ goals: serializeGoals(goals) });
}
