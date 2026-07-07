import { notFound } from "next/navigation";
import { ProblemDetailView } from "@/components/dsa/ProblemDetailView";
import { requireUser } from "@/lib/auth";
import { serializeProblem } from "@/lib/problem-utils";
import { prisma } from "@/lib/db";

type ProblemDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProblemDetailPage({ params }: ProblemDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const problem = await prisma.problem.findFirst({
    where: { id, userId: user.id }
  });

  if (!problem) {
    notFound();
  }

  return <ProblemDetailView problem={serializeProblem(problem)} />;
}
