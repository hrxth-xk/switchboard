import { GoalsEditor } from "@/components/dashboard/macro/GoalsEditor";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serializeGoals } from "@/lib/goals";

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await prisma.userGoals.findUnique({ where: { userId: user.id } });

  return (
    <div className="goals-page-shell">
      <header className="page-header compact">
        <div>
          <p className="section-eyebrow">Settings</p>
          <h1 className="panel-title">Goals</h1>
        </div>
      </header>
      <GoalsEditor goals={serializeGoals(goals)} />
    </div>
  );
}
