import { cleanRoleTitle, jobPostingFields, titleCaseSlug } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const leverImporter: JobImporter = {
  id: "lever",
  matches(url) {
    return /(^|\.)lever\.co$/i.test(url.hostname) && url.pathname.length > 1;
  },
  async importJob(url, html) {
    const parts = url.pathname.split("/").filter(Boolean);
    const companySlug = parts[0];
    const jobId = parts[1] ?? null;
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
