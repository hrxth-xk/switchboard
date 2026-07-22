import { cleanRoleTitle, jobPostingFields } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const amazonImporter: JobImporter = {
  id: "amazon",
  matches(url) {
    return /(^|\.)amazon\.jobs$/i.test(url.hostname);
  },
  async importJob(url, html) {
    const idMatch = url.pathname.match(/\/jobs\/(\d+)/i);
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? "Amazon",
      role: cleanRoleTitle(fields?.role),
      jobId: fields?.jobId ?? idMatch?.[1] ?? null,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
