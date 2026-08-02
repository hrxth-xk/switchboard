import type { BoardId, UrlFacts } from "@/lib/job-import/url-parse";

export type JobField = "company" | "role" | "jobId" | "location" | "description";

/** Where a value came from, ordered loosely by how much we trust it. */
export type FieldSource = "manual" | "api" | "jsonld" | "url" | "og" | "title";

export type JobImportResult = {
  /** Nullable since the all-or-nothing gate was removed — partial wins are still wins. */
  company: string | null;
  role: string | null;
  jobId: string | null;
  location: string | null;
  jobUrl: string;
  description: string | null;
};

export type Provenance = Partial<Record<JobField, { source: FieldSource; confidence: number }>>;

export type NoticeCode = "legacy_host_redirect" | "api_unavailable" | "no_data";

export type FetchedPage = {
  html: string;
  finalUrl: URL;
  /** True when redirects landed us on a different host than we asked for. */
  crossHost: boolean;
  hops: number;
};

/** One source's contribution. Importers return these instead of a whole draft. */
export type SourcedDraft = {
  source: FieldSource;
  /** 0 drops every field in this draft — used to distrust a cross-host page. */
  multiplier?: number;
  fields: Partial<Record<JobField, string | null>>;
};

export type ImportContext = {
  url: URL;
  facts: UrlFacts;
  fetchHtml: (target: URL) => Promise<FetchedPage | null>;
  fetchJson: <T>(target: URL) => Promise<T | null>;
  remainingMs: () => number;
  note: (code: NoticeCode, message: string) => void;
};

export type JobImporter = {
  id: string;
  matches: (facts: UrlFacts) => boolean;
  /** Network enrichment. MUST NOT throw — return [] when nothing was learned. */
  enrich: (ctx: ImportContext) => Promise<SourcedDraft[]>;
  /** false skips the shared HTML pass entirely. */
  allowHtmlFallback?: boolean;
};

export type JobImportSuccess = {
  ok: true;
  job: JobImportResult;
  provenance: Provenance;
  /** Fields the user still has to type. Never a reason to fail the import. */
  unresolved: JobField[];
  board: BoardId;
  notice?: { code: NoticeCode; message: string };
};

export type JobImportFailure = {
  ok: false;
  code: "invalid_url" | "blocked_url" | "rate_limited";
  error: string;
  retryAfterSeconds?: number;
};

export type JobImportResponse = JobImportSuccess | JobImportFailure;
