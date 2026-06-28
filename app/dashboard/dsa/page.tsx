import { ProblemList } from "@/components/dsa/ProblemList";
import { ProblemStatsStrip } from "@/components/dsa/ProblemStatsStrip";
import { ReviewQueue } from "@/components/dsa/ReviewQueue";
import { requireUser } from "@/lib/auth";
import { getAllProblemsSorted, getProblemStats, getReviewQueue, serializeProblem } from "@/lib/problem-utils";
import { prisma } from "@/lib/db";

export default async function DsaPage() {
  const user = await requireUser();
  const problems = await prisma.problem.findMany({
    where: { userId: user.id },
    orderBy: { lastPracticed: "desc" }
  });

  const now = new Date();
  const stats = getProblemStats(problems, now);
  const reviewQueue = getReviewQueue(problems, now);
  const allProblems = getAllProblemsSorted(problems);

  return (
    <div className="workspace-page">
      <ProblemStatsStrip {...stats} />
      <ReviewQueue problems={reviewQueue.map(serializeProblem)} />
      <ProblemList problems={allProblems.map(serializeProblem)} />
    </div>
  );
}
