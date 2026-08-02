/** User-facing import copy. Client-safe — the Quick Add sheet imports this. */

export const JOB_IMPORT_MESSAGES = {
  invalidUrl: "That doesn't look like a link. Paste the job posting URL.",
  blockedUrl: "That link isn't reachable. Paste a public job posting URL.",
  rateLimited: "Too many imports just now — give it a minute.",
  noData: "We couldn't read that posting. Fill in the details manually.",
  apiUnavailable: "The job board didn't answer. We filled in what the link told us.",
  legacyHostRedirect: "This posting has moved. We read the company and job number from the link — check the role.",
  loading: "Reading the posting…"
} as const;

/** Kept for the LeetCode importer, which shares the Quick Add import UI. */
export const PROBLEM_IMPORT_FALLBACK =
  "We couldn't fetch that LeetCode problem. Please fill the details manually.";
