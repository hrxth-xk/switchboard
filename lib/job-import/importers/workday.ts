import { cleanRoleTitle, jobPostingFields, titleCaseSlug } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const workdayImporter: JobImporter = {
  id: "workday",
  matches(url) {
    return /myworkdayjobs\.com$/i.test(url.hostname) || /workdayjobs\.com$/i.test(url.hostname);
  },
  async importJob(url, html) {
    const parts = url.pathname.split("/").filter(Boolean);
    const jobIndex = parts.findIndex((part) => part.toLowerCase() === "job");
    const titleSlug = jobIndex >= 0 ? parts[jobIndex + 2] ?? parts[jobIndex + 1] : null;
    const jobIdMatch = titleSlug?.match(/_([A-Z0-9-]+)$/i) ?? url.pathname.match(/\/(JR\d+)\b/i);
    const hostCompany = url.hostname.split(".")[0]?.replace(/wd\d+$/i, "");
    const fields = html ? jobPostingFields(html) : null;

    return {
      company: fields?.company ?? (hostCompany ? titleCaseSlug(hostCompany) : null),
      role:
        cleanRoleTitle(fields?.role) ??
        (titleSlug ? titleCaseSlug(titleSlug.replace(/_[A-Z0-9-]+$/i, "")) : null),
      jobId: fields?.jobId ?? jobIdMatch?.[1] ?? null,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
