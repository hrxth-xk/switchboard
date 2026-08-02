import { stripTags } from "@/lib/job-import/html";
import { JOB_IMPORT_MESSAGES } from "@/lib/job-import/messages";
import type { JobImporter, SourcedDraft } from "@/lib/job-import/types";
import { registrableDomain } from "@/lib/job-import/url-parse";

/**
 * Eightfold AI job boards (Microsoft, among many others).
 *
 * The URL carries an internal position id, e.g.
 *   apply.careers.microsoft.com/careers/job/1970393556934084?domain=microsoft.com
 * but the number a recruiter quotes is 200043540. The only place that mapping
 * exists is Eightfold's per-job API, which is public even where the /jobs list
 * endpoint is locked down ("Not authorized for PCSX").
 */

type EightfoldJob = {
  id?: number | string;
  name?: string;
  posting_name?: string;
  location?: string;
  locations?: string[];
  ats_job_id?: string;
  display_job_id?: string;
  job_description?: string;
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export const eightfoldImporter: JobImporter = {
  id: "eightfold",
  matches: (facts) => facts.board === "eightfold" && Boolean(facts.positionId),
  allowHtmlFallback: true,

  async enrich(ctx) {
    const pid = ctx.facts.positionId;
    if (!pid) return [];

    const endpoint = `${ctx.url.origin}/api/apply/v2/jobs/${encodeURIComponent(pid)}`;

    // Tenants key on different `domain` values; try the most specific first.
    const domains = [ctx.facts.domain, registrableDomain(ctx.url.hostname), ctx.url.hostname, null].filter(
      (value, index, all) => all.indexOf(value) === index
    );

    for (const domain of domains) {
      if (ctx.remainingMs() < 800) break;

      const target = new URL(endpoint);
      if (domain) target.searchParams.set("domain", domain);

      const job = await ctx.fetchJson<EightfoldJob>(target);
      if (!job || job.id === undefined) continue;

      const draft: SourcedDraft = {
        source: "api",
        fields: {
          // The fix: the user-visible requisition number, not the pid.
          jobId: firstNonEmpty(job.display_job_id, job.ats_job_id),
          role: firstNonEmpty(job.posting_name, job.name),
          location: firstNonEmpty(job.location, job.locations?.[0]),
          description: job.job_description ? stripTags(job.job_description) : null
          // Deliberately no company: Eightfold returns `business_unit`
          // ("Finance Group"), which is a department. Company comes from the
          // page's JSON-LD or the URL's domain.
        }
      };

      return [draft];
    }

    ctx.note("api_unavailable", JOB_IMPORT_MESSAGES.apiUnavailable);
    return [];
  }
};
