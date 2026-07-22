import { cleanRoleTitle, jobPostingFields, titleCaseSlug } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

export const oracleImporter: JobImporter = {
  id: "oracle",
  matches(url) {
    const host = url.hostname.toLowerCase();
    const path = `${url.pathname}${url.search}`.toLowerCase();
    return (
      host.includes("oraclecloud.com") ||
      (host.includes("oracle.com") && /career|job|requisition/i.test(path))
    );
  },
  async importJob(url, html) {
    const jobId =
      url.searchParams.get("SelectedJobReqUId") ??
      url.searchParams.get("jobId") ??
      url.pathname.match(/\/job\/([^/]+)/i)?.[1] ??
      null;
    const companyHint = url.hostname.split(".")[0];
    const fields = html ? jobPostingFields(html) : null;

    return {
      company:
        fields?.company ??
        (companyHint && !/oracle|fa\.ocs/i.test(companyHint) ? titleCaseSlug(companyHint) : "Oracle"),
      role: cleanRoleTitle(fields?.role),
      jobId: fields?.jobId ?? jobId,
      location: fields?.location,
      jobUrl: url.toString(),
      description: fields?.description
    };
  }
};
