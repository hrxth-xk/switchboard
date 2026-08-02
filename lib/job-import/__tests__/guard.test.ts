import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { inspectUrl, isBlockedIp } from "../net/guard";
import { fetchHtmlPage } from "../net/fetch";

const BLOCKED = [
  "http://169.254.169.254/latest/meta-data/", // AWS/Azure metadata
  "http://127.0.0.1:3000/x",
  "http://127.0.0.1/x",
  "http://localhost/",
  "http://sub.localhost/",
  "http://[::1]/",
  "http://2130706433/", // decimal 127.0.0.1
  "http://0177.0.0.1/", // octal
  "http://0x7f000001/", // hex
  "http://192.168.1.1/",
  "http://10.0.0.5/",
  "http://172.16.0.9/",
  "http://100.64.0.1/",
  "http://[fd00::1]/",
  "http://[fe80::1]/",
  "http://[::ffff:127.0.0.1]/",
  "https://example.com:8080/job/1",
  "http://metadata.google.internal/",
  "http://intranet/",
  "http://wiki.internal/",
  "http://user:pass@example.com/"
];

const ALLOWED = [
  "https://apply.careers.microsoft.com/careers/job/1970393556934084",
  "https://boards.greenhouse.io/acme/jobs/1",
  "http://example.com:80/job/1",
  "https://example.com:443/job/1",
  "https://8.8.8.8/job/1"
];

test("inspectUrl blocks private, loopback, metadata and odd-port targets", () => {
  for (const raw of BLOCKED) {
    const url = new URL(raw);
    const result = inspectUrl(url);
    assert.equal(result.ok, false, `${raw} must be blocked (hostname resolved to ${url.hostname})`);
  }
});

test("inspectUrl allows ordinary public job boards", () => {
  for (const raw of ALLOWED) {
    assert.equal(inspectUrl(new URL(raw)).ok, true, `${raw} must be allowed`);
  }
});

test("WHATWG URL normalises obfuscated IPv4, so the guard sees dotted quads", () => {
  assert.equal(new URL("http://2130706433/").hostname, "127.0.0.1");
  assert.equal(new URL("http://0x7f000001/").hostname, "127.0.0.1");
  assert.equal(new URL("http://0177.0.0.1/").hostname, "127.0.0.1");
});

test("isBlockedIp covers the ranges we care about", () => {
  for (const ip of ["127.0.0.1", "169.254.169.254", "10.1.2.3", "192.168.0.1", "::1", "fd12::9"]) {
    assert.equal(isBlockedIp(ip), true, `${ip} must be blocked`);
  }
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) {
    assert.equal(isBlockedIp(ip), false, `${ip} must be allowed`);
  }
});

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

test("a redirect to cloud metadata is never followed", async () => {
  const requested: string[] = [];

  globalThis.fetch = (async (input: string | URL | Request) => {
    const target = String(input);
    requested.push(target);
    return new Response(null, {
      status: 302,
      headers: { location: "http://169.254.169.254/latest/meta-data/" }
    });
  }) as typeof fetch;

  const page = await fetchHtmlPage(new URL("https://example.com/job/1"));

  assert.equal(page, null, "the import must fail rather than read metadata");
  assert.equal(
    requested.some((url) => url.includes("169.254.169.254")),
    false,
    "the metadata host must never be requested"
  );
});

test("redirect chains are capped", async () => {
  let calls = 0;

  globalThis.fetch = (async (input: string | URL | Request) => {
    calls += 1;
    const next = new URL(String(input));
    next.pathname = `${next.pathname}/x`;
    return new Response(null, { status: 302, headers: { location: next.toString() } });
  }) as typeof fetch;

  const page = await fetchHtmlPage(new URL("https://example.com/job/1"));

  assert.equal(page, null);
  assert.ok(calls <= 6, `expected the hop cap to stop the loop, saw ${calls} requests`);
});

// Both hosts must really resolve — the guard does a DNS pre-check on every hop.
test("cross-host redirects are reported so callers can distrust the page", async () => {
  let call = 0;

  globalThis.fetch = (async () => {
    call += 1;
    if (call === 1) {
      return new Response(null, {
        status: 302,
        headers: { location: "https://www.example.com/careers" }
      });
    }
    return new Response("<title>Careers</title>", {
      status: 200,
      headers: { "content-type": "text/html" }
    });
  }) as typeof fetch;

  const page = await fetchHtmlPage(new URL("https://example.com/global/en/job/1878594/Engineer"));

  assert.ok(page);
  assert.equal(page.crossHost, true);
  assert.equal(page.hops, 1);
});
