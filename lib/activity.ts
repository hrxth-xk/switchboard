import { prisma } from "@/lib/db";

export async function logActivity(userId: string, label: string) {
  await prisma.activity.create({
    data: { userId, label }
  });
}

/** Removes the newest activity with this label, e.g. when an action is undone. */
export async function deleteLatestActivity(userId: string, label: string) {
  const latest = await prisma.activity.findFirst({
    where: { userId, label },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });
  if (!latest) return false;

  await prisma.activity.delete({ where: { id: latest.id } });
  return true;
}

export async function logActivities(userId: string, labels: string[]) {
  if (!labels.length) return;

  await prisma.activity.createMany({
    data: labels.map((label) => ({ userId, label }))
  });
}
