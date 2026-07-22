import { cleanRoleTitle, jobPostingFields } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const googleImporter: JobImporter = {
  id: "google",
  matches(url) {
    const host = url.hostname.toLowerCase();
    return (
      host === "careers.google.com" ||
      host.endsWith(".careers.google.com") ||
      (host.endsWith("google.com") && /\/jobs\//i.test(url.pathname))
    );
  },
  async importJob(url, html) {
    const pathId =
      url.pathname.match(/\/jobs\/results\/(\d+)/i)?.[1] ??
      url.pathname.match(/\/jobs\/(\d+)/i)?.[1] ??
      null;
    const jobId = pathId ?? url.searchParams.get("job_id");
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? "Google",
      role: cleanRoleTitle(fields?.role),
      jobId: fields?.jobId ?? jobId,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
