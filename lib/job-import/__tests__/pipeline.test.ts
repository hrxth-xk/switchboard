import assert from "node:assert/strict";
import { test } from "node:test";
import { importJobFromUrl, type ImportFetchers } from "../index";
import type { FetchedPage, JobImportSuccess } from "../types";
import {
  EIGHTFOLD_API_JOB,
  EIGHTFOLD_JOB_HTML,
  MICROSOFT_EIGHTFOLD_URL,
  MICROSOFT_LANDING_HTML,
  MICROSOFT_LEGACY_JOB_URL,
  MICROSOFT_LEGACY_SHARE_URL
} from "./fixtures/microsoft";

const PID = "1970393556934084";
const REAL_JOB_NUMBER = "200043540";

function page(html: string, finalUrl: string, crossHost = false): FetchedPage {
  return { html, finalUrl: new URL(finalUrl), crossHost, hops: crossHost ? 2 : 0 };
}

function fetchers(overrides: Partial<ImportFetchers>): ImportFetchers {
  return {
    fetchHtml: async () => null,
    fetchJson: async () => null,
    ...overrides
  } as ImportFetchers;
}

async function importOk(url: string, stubs: Partial<ImportFetchers>) {
  const result = await importJobFromUrl(url, { fetchers: fetchers(stubs) });
  assert.equal(result.ok, true, "the pipeline must never fail outright on a valid URL");
  return result as JobImportSuccess;
}

/* A — the headline case, with the Eightfold API answering. */
test("Microsoft import stores the real job number, not the Eightfold pid", async () => {
  const result = await importOk(MICROSOFT_EIGHTFOLD_URL, {
    fetchJson: async () => EIGHTFOLD_API_JOB as never,
    fetchHtml: async () => page(EIGHTFOLD_JOB_HTML, MICROSOFT_EIGHTFOLD_URL)
  });

  assert.equal(result.job.jobId, REAL_JOB_NUMBER);
  assert.notEqual(result.job.jobId, PID, "the internal position id must never reach the Job ID field");
  assert.equal(result.job.role, "Software Engineer");
  assert.equal(result.job.company, "Microsoft");
  assert.equal(result.job.location, "India, Telangana, Hyderabad");
  assert.deepEqual(result.unresolved, []);
  assert.equal(result.board, "eightfold");
  assert.equal(result.provenance.jobId?.source, "api");

  // Tracking stripped, payload kept.
  assert.ok(result.job.jobUrl.includes("domain=microsoft.com"));
  assert.ok(!result.job.jobUrl.includes("src=LinkedIn"));
});

/* B — the same URL when the API is locked down. */
test("when the board API 403s, the job ID is left blank rather than wrong", async () => {
  const result = await importOk(MICROSOFT_EIGHTFOLD_URL, {
    fetchJson: async () => null,
    fetchHtml: async () => page(EIGHTFOLD_JOB_HTML, MICROSOFT_EIGHTFOLD_URL)
  });

  assert.equal(result.job.jobId, null);
  assert.notEqual(result.job.jobId, PID, "falling back to the pid is the regression that matters");
  assert.deepEqual(result.unresolved, ["jobId"]);

  // The page's JSON-LD still carries everything else.
  assert.equal(result.job.role, "Software Engineer");
  assert.equal(result.job.company, "Microsoft");
  assert.ok(result.job.location?.includes("Hyderabad"));
  assert.equal(result.notice?.code, "api_unavailable");
});

/* C — legacy host, which now redirects to a generic careers page. */
test("legacy Microsoft URLs never take their role from the redirect target", async () => {
  const result = await importOk(MICROSOFT_LEGACY_JOB_URL, {
    fetchHtml: async () => page(MICROSOFT_LANDING_HTML, "https://apply.careers.microsoft.com/careers", true)
  });

  assert.notEqual(result.job.role, "Careers", "this was the bug");
  assert.equal(result.job.role, "Software Engineer II");
  assert.equal(result.job.company, "Microsoft");
  assert.equal(result.job.jobId, "1878594");
  assert.equal(result.board, "microsoft-legacy");
  assert.equal(result.notice?.code, "legacy_host_redirect");
});

/* D — the share/copy link, which used to yield no ID at all. */
test("legacy share links still yield the job number", async () => {
  const result = await importOk(MICROSOFT_LEGACY_SHARE_URL, {
    fetchHtml: async () => page(MICROSOFT_LANDING_HTML, "https://apply.careers.microsoft.com/careers", true)
  });

  assert.equal(result.job.jobId, "1878594");
  assert.equal(result.job.company, "Microsoft");
  assert.notEqual(result.job.role, "Careers");
  assert.ok(result.unresolved.includes("role"));
});

/* Defence in depth: even without the cross-host signal, boilerplate is rejected. */
test("a careers landing page cannot supply a role even on the same host", async () => {
  const result = await importOk("https://jobs.example.com/global/en/job/1878594/", {
    fetchHtml: async () => page(MICROSOFT_LANDING_HTML, "https://jobs.example.com/global/en/job/1878594/")
  });

  assert.notEqual(result.job.role, "Careers");
  assert.notEqual(result.job.role, "Careers at Microsoft");
  assert.equal(result.job.role, null);
});

test("a totally opaque page still returns the URL-derived fields", async () => {
  const result = await importOk("https://boards.greenhouse.io/acme/jobs/4012345", {});

  assert.equal(result.job.company, "Acme");
  assert.equal(result.job.jobId, "4012345");
  assert.equal(result.provenance.company?.source, "url");
});

test("blocked and malformed URLs fail with a specific code", async () => {
  const blocked = await importJobFromUrl("http://169.254.169.254/latest/meta-data/");
  assert.equal(blocked.ok, false);
  assert.equal(blocked.ok === false && blocked.code, "blocked_url");

  const invalid = await importJobFromUrl("not a url at all");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.ok === false && invalid.code, "invalid_url");
});
