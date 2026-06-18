import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@switchboard.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "user@switchboard.local" },
    update: {},
    create: {
      name: "SDE 1 Candidate",
      email: "user@switchboard.local",
      passwordHash: await bcrypt.hash("user1234", 12),
      role: "USER"
    }
  });

  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.interview.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.application.deleteMany({ where: { userId: user.id } });
  await prisma.topic.deleteMany({ where: { userId: user.id } });

  await prisma.topic.createMany({
    data: [
      { userId: user.id, title: "Arrays and Two Pointers", category: "DSA", difficulty: "EASY", status: "REVISING", confidence: 4, solvedCount: 42, targetCount: 50 },
      { userId: user.id, title: "Graphs: BFS/DFS", category: "DSA", difficulty: "MEDIUM", status: "LEARNING", confidence: 3, solvedCount: 18, targetCount: 35 },
      { userId: user.id, title: "Rate Limiter", category: "System Design", difficulty: "MEDIUM", status: "LEARNING", confidence: 2, solvedCount: 1, targetCount: 4 },
      { userId: user.id, title: "URL Shortener", category: "System Design", difficulty: "EASY", status: "MASTERED", confidence: 4, solvedCount: 3, targetCount: 3 }
    ]
  });

  await prisma.application.createMany({
    data: [
      { userId: user.id, company: "Atlassian", roleTitle: "Software Engineer I", location: "Bengaluru", source: "Careers", status: "APPLIED", nextStep: "Follow up with recruiter" },
      { userId: user.id, company: "Stripe", roleTitle: "Backend Engineer, New Grad", location: "Remote", source: "Referral", status: "INTERVIEWING", nextStep: "System design practice" },
      { userId: user.id, company: "Rippling", roleTitle: "SDE 1", location: "Hyderabad", source: "LinkedIn", status: "WISHLIST", nextStep: "Tailor resume" }
    ]
  });

  await prisma.goal.createMany({
    data: [
      { userId: user.id, title: "Solve focused DSA set", metric: "problems", target: 25, current: 14, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
      { userId: user.id, title: "Mock interviews", metric: "sessions", target: 4, current: 1, dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) }
    ]
  });

  await prisma.interview.create({
    data: {
      userId: user.id,
      company: "Stripe",
      round: "DSA screen",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      focus: "Graphs, DP, clean communication"
    }
  });

  await prisma.note.create({
    data: {
      userId: user.id,
      title: "Pitch",
      tag: "Behavioral",
      body: "Keep stories crisp: context, ownership, tradeoff, measurable result."
    }
  });

  console.log(`Seeded admin ${admin.email} and demo user ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
