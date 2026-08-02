import type { JobImporter } from "@/lib/job-import/types";

/**
 * Retired Microsoft careers hosts (jobs.careers.microsoft.com, careers.microsoft.com).
 *
 * These URLs now 302 twice to apply.careers.microsoft.com/careers — a generic
 * landing page. We still fetch, because that is what surfaces the cross-host
 * redirect the collector uses to discard the landing page's branding; the
 * company, job number and role all come from the URL itself.
 *
 * Mapping a legacy requisition number to the new Eightfold position id is NOT
 * possible: it would need Eightfold's /jobs search endpoint, which Microsoft's
 * tenant answers with 403 "Not authorized for PCSX". Current postings on
 * apply.careers.microsoft.com are handled by the eightfold importer instead.
 */
export const microsoftLegacyImporter: JobImporter = {
  id: "microsoft-legacy",
  matches: (facts) => facts.board === "microsoft-legacy",
  allowHtmlFallback: true,

  async enrich() {
    return [];
  }
};
