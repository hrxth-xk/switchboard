import { stripTags } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

type AmazonJobFields = {
  title?: string;
  location?: string;
  description?: string;
  id_icims?: string;
  job_id?: string;
};

/** amazon.jobs serves either the job object directly or wrapped in `{ job }`. */
type AmazonResponse = AmazonJobFields & { job?: AmazonJobFields };

export const amazonImporter: JobImporter = {
  id: "amazon",
  matches: (facts) => facts.board === "amazon",
  allowHtmlFallback: true,

  async enrich(ctx) {
    const jobId = ctx.facts.jobId;
    if (!jobId) return [];

    const target = new URL(`https://www.amazon.jobs/en/jobs/${encodeURIComponent(jobId)}.json`);
    const body = await ctx.fetchJson<AmazonResponse>(target);
    const job = body?.job ?? body;
    if (!job?.title) return [];

    return [
      {
        source: "api",
        fields: {
          role: job.title,
          location: job.location ?? null,
          description: job.description ? stripTags(job.description) : null,
          jobId: job.id_icims ?? job.job_id ?? null
        }
      }
    ];
  }
};
