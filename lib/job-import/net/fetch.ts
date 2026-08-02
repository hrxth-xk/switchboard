/**
 * The only place the job importer calls fetch().
 *
 * Redirects are walked by hand rather than with `redirect: "follow"` for two
 * reasons: every hop has to be re-checked by the SSRF guard, and the caller
 * needs to know whether we ended up on a different host than we asked for —
 * that `crossHost` flag is what stops a careers landing page being read as a
 * job posting.
 *
 * Server-only: depends on the node:dns-backed guard.
 */

import { assertPublicUrl } from "@/lib/job-import/net/guard";
import type { FetchedPage } from "@/lib/job-import/types";

const USER_AGENT = "Mozilla/5.0 (compatible; SwitchboardJobImport/1.0; +https://switchboard.app/bot)";
const MAX_HOPS = 4;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_HTML_BYTES = 1_500_000;
const DEFAULT_MAX_JSON_BYTES = 500_000;

export type SafeFetchOptions = {
  accept: string;
  timeoutMs?: number;
  maxBytes?: number;
  signal?: AbortSignal;
};

type SafeFetchOutcome = {
  response: Response;
  finalUrl: URL;
  hops: number;
  crossHost: boolean;
};

async function discard(response: Response) {
  try {
    await response.body?.cancel();
  } catch {
    // The body may already be consumed or errored; nothing to do.
  }
}

async function safeFetch(target: URL, options: SafeFetchOptions): Promise<SafeFetchOutcome | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);

  try {
    let current = new URL(target.toString());
    let hops = 0;

    for (;;) {
      const guard = await assertPublicUrl(current);
      if (!guard.ok) return null;

      const response = await fetch(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        cache: "no-store",
        headers: {
          Accept: options.accept,
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        await discard(response);
        if (++hops > MAX_HOPS) return null;

        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return null;
        }
        next.username = "";
        next.password = "";
        current = next;
        continue;
      }

      if (!response.ok) {
        await discard(response);
        return null;
      }

      return {
        response,
        finalUrl: current,
        hops,
        crossHost: current.hostname.toLowerCase() !== target.hostname.toLowerCase()
      };
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

/** Reads a body, aborting mid-stream once the cap is passed. */
async function readCapped(response: Response, maxBytes: number): Promise<string | null> {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared && declared > maxBytes) {
    await discard(response);
    return null;
  }

  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
}

export async function fetchHtmlPage(
  target: URL,
  options?: Partial<SafeFetchOptions>
): Promise<FetchedPage | null> {
  const outcome = await safeFetch(target, {
    accept: "text/html,application/xhtml+xml",
    ...options
  });
  if (!outcome) return null;

  const contentType = outcome.response.headers.get("content-type") ?? "";
  if (contentType && !/text\/html|application\/xhtml|text\/plain/i.test(contentType)) {
    await discard(outcome.response);
    return null;
  }

  const html = await readCapped(outcome.response, options?.maxBytes ?? DEFAULT_MAX_HTML_BYTES);
  if (html === null) return null;

  return {
    html,
    finalUrl: outcome.finalUrl,
    crossHost: outcome.crossHost,
    hops: outcome.hops
  };
}

export async function fetchJsonDocument<T>(
  target: URL,
  options?: Partial<SafeFetchOptions>
): Promise<T | null> {
  const outcome = await safeFetch(target, {
    accept: "application/json",
    timeoutMs: 3_500,
    ...options
  });
  if (!outcome) return null;

  const text = await readCapped(outcome.response, options?.maxBytes ?? DEFAULT_MAX_JSON_BYTES);
  if (text === null) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
