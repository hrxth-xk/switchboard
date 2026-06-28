import { prisma } from "@/lib/db";

export async function logActivity(userId: string, label: string) {
  await prisma.activity.create({
    data: { userId, label }
  });
}

export async function logActivities(userId: string, labels: string[]) {
  if (!labels.length) return;

  await prisma.activity.createMany({
    data: labels.map((label) => ({ userId, label }))
  });
}
