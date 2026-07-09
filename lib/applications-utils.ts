import type { Application } from "@prisma/client";



export const APPLICATION_STATUSES = ["APPLIED", "WISHLIST", "REJECTED", "OA", "INTERVIEW", "OFFER"] as const;



export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];



export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  OA: "OA",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected"
};

export const STATUS_SLUGS: Record<ApplicationStatus, string> = {
  WISHLIST: "wishlist",
  APPLIED: "applied",
  OA: "oa",
  INTERVIEW: "interview",
  OFFER: "offer",
  REJECTED: "rejected"
};

const SLUG_TO_STATUS = Object.fromEntries(
  APPLICATION_STATUSES.map((status) => [STATUS_SLUGS[status], status])
) as Record<string, ApplicationStatus>;

export function statusFromSlug(slug: string): ApplicationStatus | null {
  return SLUG_TO_STATUS[slug.toLowerCase()] ?? null;
}

export function getStatusCounts(applications: Application[]) {
  return Object.fromEntries(
    APPLICATION_STATUSES.map((status) => [
      status,
      applications.filter((application) => application.status === status).length
    ])
  ) as Record<ApplicationStatus, number>;
}

export function normalizeJobId(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function applicationDuplicateWhere(
  userId: string,
  company: string,
  role: string,
  jobId?: string | null,
  excludeId?: string
) {
  return {
    userId,
    company,
    role,
    jobId: normalizeJobId(jobId),
    ...(excludeId ? { NOT: { id: excludeId } } : {})
  };
}

export const APPLICATION_DUPLICATE_MESSAGE =
  "An application with this company, role, and job ID already exists.";



export type ApplicationStats = {

  wishlist: number;

  active: number;

  offers: number;

};



export function getApplicationStats(applications: Application[]): ApplicationStats {

  return {

    wishlist: applications.filter((application) => application.status === "WISHLIST").length,

    active: applications.filter((application) => ["APPLIED", "OA", "INTERVIEW"].includes(application.status)).length,

    offers: applications.filter((application) => application.status === "OFFER").length

  };

}



export function sortByAppliedAtDesc(applications: Application[]) {

  return [...applications].sort((left, right) => {

    const leftTime = left.appliedAt?.getTime() ?? 0;

    const rightTime = right.appliedAt?.getTime() ?? 0;

    return rightTime - leftTime;

  });

}



export function groupApplicationsByStatus(applications: Application[]) {

  const grouped = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, [] as Application[]])) as Record<

    ApplicationStatus,

    Application[]

  >;



  for (const application of applications) {

    const status = application.status as ApplicationStatus;

    if (grouped[status]) {

      grouped[status].push(application);

    }

  }



  for (const status of APPLICATION_STATUSES) {

    grouped[status] = sortByAppliedAtDesc(grouped[status]);

  }



  return grouped;

}



export function applicationStatusTone(status: string): "positive" | "attention" | "neutral" {
  if (status === "OFFER" || status === "INTERVIEW") return "positive";
  if (status === "APPLIED" || status === "OA") return "attention";
  return "neutral";
}

export function applicationNextAction(application: Application) {
  if (application.nextAction) return application.nextAction;

  if (application.status === "OA") return `Finish ${application.company} OA`;

  if (application.status === "INTERVIEW") return `Prepare for ${application.company} interview`;

  if (application.status === "APPLIED") return `Follow up with ${application.company}`;

  if (application.status === "WISHLIST") return `Apply to ${application.company}`;

  return `Move ${application.company} forward`;
}



export function sortApplicationsByPriority(applications: Application[]) {

  const priority: Record<string, number> = {

    INTERVIEW: 0,

    OA: 1,

    APPLIED: 2,

    WISHLIST: 3,

    OFFER: 4,

    REJECTED: 5

  };



  return [...applications].sort((left, right) => {

    const leftPriority = priority[left.status] ?? 99;

    const rightPriority = priority[right.status] ?? 99;

    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    return left.company.localeCompare(right.company);

  });

}


