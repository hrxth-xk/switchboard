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
  await prisma.activity.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });
  await prisma.application.deleteMany({ where: { userId: user.id } });
  await prisma.problem.deleteMany({ where: { userId: user.id } });

  console.log(`Seeded admin ${admin.email} and demo user ${user.email} (accounts only, no sample data)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
