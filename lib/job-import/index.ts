/**
 * Job import pipeline.
 *
 * Layers, each contributing candidates rather than a final answer:
 *   url    parse the link          always available, zero latency, unblockable
 *   api    board JSON API          Eightfold, Greenhouse, Lever, Amazon
 *   jsonld schema.org JobPosting   trusted even across a redirect
 *   og     og:* / <title>          dropped when the fetch went cross-host
 *
 * A partial result is still a result: the caller gets whatever resolved plus an
 * `unresolved` list, instead of the old all-or-nothing failure.
 *
 * Server-only.
 */

import { collectFromHtml } from "@/lib/job-import/collectors/html";
import { JOB_IMPORTERS } from "@/lib/job-import/importers";
import { JOB_IMPORT_MESSAGES } from "@/lib/job-import/messages";
import { fetchHtmlPage, fetchJsonDocument } from "@/lib/job-import/net/fetch";
import { inspectUrl } from "@/lib/job-import/net/guard";
import { addDraft, emptyCandidateSet, peek, resolveCandidates } from "@/lib/job-import/provenance";
import type {
  FetchedPage,
  ImportContext,
  JobImportResponse,
  JobImportResult,
  NoticeCode
} from "@/lib/job-import/types";
import { normalizeJobUrl, parseJobUrl } from "@/lib/job-import/url-parse";

const TOTAL_BUDGET_MS = 9_000;
const HTML_TIMEOUT_MS = 8_000;
const JSON_TIMEOUT_MS = 3_500;

export type ImportFetchers = {
  fetchHtml: (target: URL) => Promise<FetchedPage | null>;
  fetchJson: <T>(target: URL) => Promise<T | null>;
};

export type ImportJobOptions = {
  signal?: AbortSignal;
  budgetMs?: number;
  /** Test-only seam. Production always uses the guarded network layer. */
  fetchers?: ImportFetchers;
};

export async function importJobFromUrl(
  rawUrl: string,
  options?: ImportJobOptions
): Promise<JobImportResponse> {
  const url = normalizeJobUrl(rawUrl);
  if (!url) {
    return { ok: false, code: "invalid_url", error: JOB_IMPORT_MESSAGES.invalidUrl };
  }

  // Shape check before anything touches the network or picks an importer.
  if (!inspectUrl(url).ok) {
    return { ok: false, code: "blocked_url", error: JOB_IMPORT_MESSAGES.blockedUrl };
  }

  const facts = parseJobUrl(url);
  if (!facts) {
    return { ok: false, code: "invalid_url", error: JOB_IMPORT_MESSAGES.invalidUrl };
  }

  const deadline = Date.now() + (options?.budgetMs ?? TOTAL_BUDGET_MS);
  const remainingMs = () => Math.max(deadline - Date.now(), 0);

  let notice: { code: NoticeCode; message: string } | undefined;
  const note = (code: NoticeCode, message: string) => {
    notice ??= { code, message };
  };

  const set = emptyCandidateSet();
  const baseOptions = { positionId: facts.positionId, host: url.hostname };

  // Layer 1 — the URL. This is the tier the Quick Add sheet also runs locally.
  addDraft(
    set,
    {
      source: "url",
      fields: {
        company: facts.company,
        role: facts.role,
        jobId: facts.jobId,
        location: facts.location
      }
    },
    baseOptions
  );

  const fetchers: ImportFetchers = options?.fetchers ?? {
    fetchHtml: (target) =>
      fetchHtmlPage(target, {
        signal: options?.signal,
        timeoutMs: Math.min(remainingMs(), HTML_TIMEOUT_MS)
      }),
    fetchJson: <T>(target: URL) =>
      fetchJsonDocument<T>(target, {
        signal: options?.signal,
        timeoutMs: Math.min(remainingMs(), JSON_TIMEOUT_MS)
      })
  };

  const context: ImportContext = { url, facts, remainingMs, note, ...fetchers };

  const importer =
    JOB_IMPORTERS.find((item) => item.matches(facts)) ?? JOB_IMPORTERS[JOB_IMPORTERS.length - 1];

  // Layer 2 — board API.
  try {
    for (const draft of await importer.enrich(context)) {
      addDraft(set, draft, { ...baseOptions, company: peek(set, "company") });
    }
  } catch {
    // Importers are contractually not allowed to throw, but one misbehaving
    // board must never take down the whole import.
  }

  // Layer 3 — page HTML, only when something is still missing.
  const needsPage = resolveCandidates(set).unresolved.length > 0;
  if (needsPage && importer.allowHtmlFallback !== false && remainingMs() > 500) {
    const page = await context.fetchHtml(url);
    if (page) {
      collectFromHtml(page, set, facts);
      if (page.crossHost) note("legacy_host_redirect", JOB_IMPORT_MESSAGES.legacyHostRedirect);
    }
  }

  const { values, provenance, unresolved } = resolveCandidates(set);

  if (!values.company && !values.role) {
    note("no_data", JOB_IMPORT_MESSAGES.noData);
  }

  const job: JobImportResult = {
    company: values.company,
    role: values.role,
    jobId: values.jobId,
    location: values.location,
    jobUrl: facts.canonicalUrl,
    description: values.description
  };

  return { ok: true, board: facts.board, job, provenance, unresolved, notice };
}

export { JOB_IMPORT_MESSAGES };
export type { JobImportResponse, JobImportResult };
