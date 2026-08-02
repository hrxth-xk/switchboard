import assert from "node:assert/strict";
import { test } from "node:test";
import {
  eightfoldPid,
  hostIs,
  looksLikeJobUrl,
  normalizeJobUrl,
  parseJobUrl,
  registrableDomain,
  stripTrackingParams
} from "../url-parse";

const MICROSOFT_EIGHTFOLD =
  "https://apply.careers.microsoft.com/careers/job/1970393556934084?domain=microsoft.com&src=LinkedIn";
const MICROSOFT_LEGACY_JOB = "https://jobs.careers.microsoft.com/global/en/job/1878594/Software-Engineer-II";
const MICROSOFT_LEGACY_SHARE = "https://jobs.careers.microsoft.com/global/en/share/1878594/";

/*
 * Test A′ from the plan: the client-side instant-fill guarantee. No network is
 * involved, so this is the strongest possible statement of the headline fix.
 */
test("Eightfold pid never becomes the job ID", () => {
  const facts = parseJobUrl(MICROSOFT_EIGHTFOLD);
  assert.ok(facts);

  assert.equal(facts.board, "eightfold");
  assert.equal(facts.positionId, "1970393556934084");
  assert.equal(facts.jobId, null, "the pid in the path is not a job number");
  assert.notEqual(facts.jobId, "1970393556934084");
  assert.equal(facts.company, "Microsoft");
  assert.equal(facts.domain, "microsoft.com");
});

test("canonical URL drops tracking but keeps payload params", () => {
  const facts = parseJobUrl(MICROSOFT_EIGHTFOLD);
  assert.ok(facts);

  assert.ok(facts.canonicalUrl.includes("domain=microsoft.com"));
  assert.ok(!facts.canonicalUrl.includes("src=LinkedIn"));
});

test("legacy Microsoft job URLs still yield the requisition number and role", () => {
  const facts = parseJobUrl(MICROSOFT_LEGACY_JOB);
  assert.ok(facts);

  assert.equal(facts.board, "microsoft-legacy");
  assert.equal(facts.company, "Microsoft");
  assert.equal(facts.jobId, "1878594");
  assert.equal(facts.role, "Software Engineer II");
  assert.notEqual(facts.role, "Careers");
});

test("legacy Microsoft share links yield a job ID (previously null)", () => {
  const facts = parseJobUrl(MICROSOFT_LEGACY_SHARE);
  assert.ok(facts);

  assert.equal(facts.board, "microsoft-legacy");
  assert.equal(facts.jobId, "1878594");
  assert.equal(facts.company, "Microsoft");
  assert.equal(facts.role, null);
});

test("hostIs is not fooled by substring or suffix lookalikes", () => {
  const spoofs = [
    ["https://greenhouse.evil.com/jobs/1", "greenhouse.io"],
    ["https://evilgoogle.com/jobs/1", "google.com"],
    ["https://oraclecloud.com.evil.com/job/1", "oraclecloud.com"],
    ["https://notlinkedin.com/jobs/view/1", "linkedin.com"]
  ] as const;

  for (const [raw, domain] of spoofs) {
    const url = normalizeJobUrl(raw);
    assert.ok(url);
    assert.equal(hostIs(url, domain), false, `${raw} must not match ${domain}`);
  }

  const real = normalizeJobUrl("https://boards.greenhouse.io/acme/jobs/4012345");
  assert.ok(real);
  assert.equal(hostIs(real, "greenhouse.io"), true);
});

test("spoofed hosts fall through to the generic board", () => {
  assert.equal(parseJobUrl("https://evilgoogle.com/jobs/1")?.board, "generic");
  assert.equal(parseJobUrl("https://greenhouse.evil.com/x/1")?.board, "generic");
});

test("board detection covers the common ATS shapes", () => {
  assert.equal(parseJobUrl("https://boards.greenhouse.io/acme/jobs/4012345")?.jobId, "4012345");
  assert.equal(parseJobUrl("https://boards.greenhouse.io/acme/jobs/4012345")?.company, "Acme");
  assert.equal(parseJobUrl("https://jobs.lever.co/acme/2b7c-uuid")?.jobId, "2b7c-uuid");
  assert.equal(parseJobUrl("https://jobs.ashbyhq.com/acme/9f1e-uuid")?.jobId, "9f1e-uuid");
  assert.equal(parseJobUrl("https://www.amazon.jobs/en/jobs/2891234/sde-ii")?.jobId, "2891234");
  assert.equal(parseJobUrl("https://www.amazon.jobs/en/jobs/2891234/sde-ii")?.company, "Amazon");
  assert.equal(
    parseJobUrl("https://acme.wd1.myworkdayjobs.com/en-US/careers/job/London/Engineer_JR-12345")?.jobId,
    "JR-12345"
  );
  assert.equal(parseJobUrl("https://www.linkedin.com/jobs/view/4012345678/")?.jobId, "4012345678");
});

test("greenhouse embedded boards read gh_jid from the employer's own domain", () => {
  const facts = parseJobUrl("https://www.acme.com/careers?gh_jid=4012345");
  assert.ok(facts);
  assert.equal(facts.board, "greenhouse");
  assert.equal(facts.jobId, "4012345");
  assert.equal(facts.company, "Acme");
});

test("eightfoldPid accepts both URL shapes", () => {
  assert.equal(eightfoldPid(new URL("https://x.eightfold.ai/careers?pid=1970393556934084")), "1970393556934084");
  assert.equal(eightfoldPid(new URL("https://x.eightfold.ai/careers/job/1970393556934084")), "1970393556934084");
  assert.equal(eightfoldPid(new URL("https://jobs.careers.microsoft.com/global/en/job/1878594/T")), null);
});

test("normalizeJobUrl adds a scheme and rejects non-http protocols", () => {
  assert.equal(normalizeJobUrl("stripe.com/jobs/1")?.toString(), "https://stripe.com/jobs/1");
  assert.equal(normalizeJobUrl("file:///etc/passwd"), null);
  assert.equal(normalizeJobUrl("javascript:alert(1)"), null);
  assert.equal(normalizeJobUrl("   "), null);
});

test("looksLikeJobUrl accepts scheme-less input and rejects junk", () => {
  assert.equal(looksLikeJobUrl("stripe.com/jobs/1"), true);
  assert.equal(looksLikeJobUrl("not a url"), false);
  assert.equal(looksLikeJobUrl("localhost"), false);
});

test("registrableDomain handles multi-part TLDs", () => {
  assert.equal(registrableDomain("apply.careers.microsoft.com"), "microsoft.com");
  assert.equal(registrableDomain("jobs.acme.co.uk"), "acme.co.uk");
  assert.equal(registrableDomain("acme.com"), "acme.com");
});

test("stripTrackingParams removes analytics only", () => {
  const url = new URL("https://x.com/job/1?pid=7&domain=x.com&utm_source=a&trk=b&gh_jid=9#frag");
  const clean = stripTrackingParams(url);

  assert.equal(clean.searchParams.get("pid"), "7");
  assert.equal(clean.searchParams.get("domain"), "x.com");
  assert.equal(clean.searchParams.get("gh_jid"), "9");
  assert.equal(clean.searchParams.get("utm_source"), null);
  assert.equal(clean.searchParams.get("trk"), null);
  assert.equal(clean.hash, "");
});
