import { decodeHtmlEntities, stripTags } from "@/lib/job-import/html";
import type { JobImporter } from "@/lib/job-import/types";

type GreenhouseJob = {
  id?: number | string;
  title?: string;
  location?: { name?: string };
  content?: string;
};

export const greenhouseImporter: JobImporter = {
  id: "greenhouse",
  matches: (facts) => facts.board === "greenhouse",
  allowHtmlFallback: true,

  async enrich(ctx) {
    const board = ctx.facts.companySlug;
    const jobId = ctx.facts.jobId;
    if (!board || !jobId) return [];

    const target = new URL(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${encodeURIComponent(jobId)}`
    );

    const job = await ctx.fetchJson<GreenhouseJob>(target);
    if (!job?.title) return [];

    return [
      {
        source: "api",
        fields: {
          role: job.title,
          location: job.location?.name ?? null,
          // `content` arrives entity-encoded, so decode before stripping tags.
          description: job.content ? stripTags(decodeHtmlEntities(job.content)) : null,
          jobId: job.id === undefined ? null : String(job.id)
        }
      }
    ];
  }
};
