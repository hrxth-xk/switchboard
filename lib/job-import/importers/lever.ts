import type { JobImporter } from "@/lib/job-import/types";

type LeverPosting = {
  id?: string;
  text?: string;
  categories?: { location?: string; team?: string };
  descriptionPlain?: string;
};

export const leverImporter: JobImporter = {
  id: "lever",
  matches: (facts) => facts.board === "lever",
  allowHtmlFallback: true,

  async enrich(ctx) {
    const site = ctx.facts.companySlug;
    const jobId = ctx.facts.jobId;
    if (!site || !jobId) return [];

    const target = new URL(
      `https://api.lever.co/v0/postings/${encodeURIComponent(site)}/${encodeURIComponent(jobId)}`
    );

    const posting = await ctx.fetchJson<LeverPosting>(target);
    if (!posting?.text) return [];

    return [
      {
        source: "api",
        fields: {
          role: posting.text,
          location: posting.categories?.location ?? null,
          description: posting.descriptionPlain ?? null,
          jobId: posting.id ?? null
        }
      }
    ];
  }
};
