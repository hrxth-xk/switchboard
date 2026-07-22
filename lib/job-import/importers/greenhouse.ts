import { cleanRoleTitle, jobPostingFields, titleCaseSlug } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const greenhouseImporter: JobImporter = {
  id: "greenhouse",
  matches(url) {
    const host = url.hostname.toLowerCase();
    return (
      (host === "boards.greenhouse.io" ||
        host.endsWith(".greenhouse.io") ||
        host.includes("greenhouse")) &&
      /\/jobs\//i.test(url.pathname)
    );
  },
  async importJob(url, html) {
    const parts = url.pathname.split("/").filter(Boolean);
    const jobsIndex = parts.findIndex((part) => part.toLowerCase() === "jobs");
    const companySlug = jobsIndex > 0 ? parts[jobsIndex - 1] : parts[0];
    const jobId = jobsIndex >= 0 ? parts[jobsIndex + 1]?.split("?")[0] ?? null : null;
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? (companySlug ? titleCaseSlug(companySlug) : null),
      role: cleanRoleTitle(fields?.role),
      jobId: fields?.jobId ?? jobId,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
