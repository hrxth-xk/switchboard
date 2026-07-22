import { cleanRoleTitle, jobPostingFields } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const linkedInImporter: JobImporter = {
  id: "linkedin",
  matches(url) {
    return /(^|\.)linkedin\.com$/i.test(url.hostname) && /\/jobs\//i.test(url.pathname);
  },
  async importJob(url, html) {
    const idMatch =
      url.pathname.match(/\/jobs\/view\/(\d+)/i) ?? url.pathname.match(/\/jobs\/(\d+)/i);
    const jobId = idMatch?.[1] ?? url.searchParams.get("currentJobId");
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? null,
      role: cleanRoleTitle(fields?.role) ?? null,
      jobId,
      location: fields?.location ?? null,
      jobUrl: url.toString(),
      description: fields?.description ?? null
    };
  }
};
