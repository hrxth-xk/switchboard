import { JOB_IMPORTERS } from "@/lib/job-import/importers";
import type { JobImportDraft, JobImportResponse, JobImportResult } from "@/lib/job-import/types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 1_500_000;

const FALLBACK_MESSAGE = "We couldn't extract the job details. Please fill them manually.";

function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchPageHtml(url: URL): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent":
          "Mozilla/5.0 (compatible; SwitchboardJobImport/1.0; +https://localhost)",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cache: "no-store"
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml/i.test(contentType) && contentType.length > 0) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) return null;

    return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function toResult(url: URL, draft: JobImportDraft): JobImportResult | null {
  const company = draft.company?.trim() || "";
  const role = draft.role?.trim() || "";
  if (!company || !role) return null;

  return {
    company,
    role,
    jobId: draft.jobId?.trim() || null,
    location: draft.location?.trim() || null,
    jobUrl: draft.jobUrl?.trim() || url.toString(),
    description: draft.description?.trim() || null
  };
}

/**
 * Resolve a job posting URL to a normalized job object.
 * The caller never needs to know which importer matched.
 */
export async function importJobFromUrl(rawUrl: string): Promise<JobImportResponse> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return { ok: false, error: FALLBACK_MESSAGE };
  }

  const importer = JOB_IMPORTERS.find((item) => item.matches(url));
  if (!importer) {
    return { ok: false, error: FALLBACK_MESSAGE };
  }

  const html = await fetchPageHtml(url);
  const draft = await importer.importJob(url, html);
  const job = draft ? toResult(url, draft) : null;

  if (!job) {
    return { ok: false, error: FALLBACK_MESSAGE };
  }

  return { ok: true, job };
}

export { FALLBACK_MESSAGE };
export type { JobImportResult, JobImportResponse };
