import { redirect } from "next/navigation";
import { statusFromSlug } from "@/lib/applications-utils";

type ApplicationStatusPageProps = {
  params: Promise<{ status: string }>;
};

export default async function ApplicationStatusPage({ params }: ApplicationStatusPageProps) {
  const { status: statusSlug } = await params;
  const status = statusFromSlug(statusSlug);

  if (!status) {
    redirect("/dashboard/applications");
  }

  redirect(`/dashboard/applications?tab=${statusSlug}`);
}
