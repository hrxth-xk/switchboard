import { notFound } from "next/navigation";
import { ApplicationDetailView } from "@/components/applications/ApplicationDetailView";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const user = await requireUser();

  const application = await prisma.application.findFirst({
    where: { id, userId: user.id },
    include: {
      resumeVersion: {
        select: {
          id: true,
          name: true,
          version: true,
          originalFileName: true,
          createdAt: true,
          oneOff: true
        }
      }
    }
  });

  if (!application) {
    notFound();
  }

  return <ApplicationDetailView application={application} />;
}
