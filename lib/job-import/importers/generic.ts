import { cleanRoleTitle, jobPostingFields } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

/** Last-resort importer: JSON-LD / Open Graph only. Always matches. */
export const genericImporter: JobImporter = {
  id: "generic",
  matches() {
    return true;
  },
  async importJob(url, html) {
    if (!html) return null;
    const fields = jobPostingFields(html);
    if (!fields.company && !fields.role) return null;

    return {
      company: fields.company,
      role: cleanRoleTitle(fields.role),
      jobId: fields.jobId,
      location: fields.location,
      jobUrl: url.toString(),
      description: fields.description
    };
  }
};
