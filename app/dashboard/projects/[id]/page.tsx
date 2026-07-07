import { notFound } from "next/navigation";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const project = await prisma.project.findFirst({
    where: { id, userId: user.id }
  });

  if (!project) {
    notFound();
  }

  return <ProjectDetailView project={project} />;
}
