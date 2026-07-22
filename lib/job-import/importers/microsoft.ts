import { cleanRoleTitle, jobPostingFields } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const microsoftImporter: JobImporter = {
  id: "microsoft",
  matches(url) {
    return /(careers\.microsoft\.com|jobs\.careers\.microsoft\.com)$/i.test(url.hostname);
  },
  async importJob(url, html) {
    const idMatch = url.pathname.match(/\/job\/(\d+)/i);
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? "Microsoft",
      role: cleanRoleTitle(fields?.role),
      jobId: fields?.jobId ?? idMatch?.[1] ?? null,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
