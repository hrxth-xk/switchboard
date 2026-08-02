/**
 * SSRF guard for the job importer.
 *
 * The import endpoint fetches a URL the user typed, so without this a paste of
 * http://169.254.169.254/ would have the server read cloud metadata on their
 * behalf. Every URL — and every redirect hop — passes through here first.
 *
 * Server-only: uses node:dns.
 *
 * RESIDUAL RISK: classic DNS rebinding is not fully closed. We resolve the host
 * and check the addresses, but Node's fetch resolves again independently, so a
 * name that answers public-then-private can still slip through. Closing that
 * needs a custom undici Agent with a connect hook, which is out of scope here.
 * Mitigating factors: IP-literal and hostname blocking, the DNS pre-check, the
 * 80/443 port restriction, the 4-hop redirect cap, and the fact that response
 * bodies are only ever parsed for job fields and never echoed back to the user.
 */

import { lookup } from "node:dns/promises";

export type GuardReason =
  | "protocol"
  | "port"
  | "credentials"
  | "ip-literal"
  | "private-host"
  | "single-label"
  | "dns-private"
  | "dns-failed";

export type GuardResult = { ok: true } | { ok: false; reason: GuardReason };

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.goog",
  "instance-data"
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".home.arpa", ".onion"];

/** IPv4 ranges that are never a public job board. */
const BLOCKED_V4: Array<readonly [string, number]> = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4]
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

/** Compares the top `bits` without 32-bit signed shift hazards. */
function inCidr(address: number, base: string, bits: number) {
  const baseInt = ipv4ToInt(base);
  if (baseInt === null) return false;
  const block = 2 ** (32 - bits);
  return Math.floor(address / block) === Math.floor(baseInt / block);
}

function isBlockedIpv4(ip: string) {
  const address = ipv4ToInt(ip);
  if (address === null) return false;
  return BLOCKED_V4.some(([base, bits]) => inCidr(address, base, bits));
}

function isBlockedIpv6(raw: string) {
  const ip = raw.toLowerCase().replace(/^\[/, "").replace(/\]$/, "").replace(/%.*$/, "");
  if (ip === "::" || ip === "::1") return true;

  const fromGroups = (highHex: string, lowHex: string) => {
    const high = parseInt(highHex, 16);
    const low = parseInt(lowHex, 16);
    return isBlockedIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  };

  // IPv4-mapped and NAT64 forms wrap a v4 address — unwrap and re-check.
  const embedded = ip.match(/^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) return isBlockedIpv4(embedded[1]);

  // ...and URL normalises ::ffff:127.0.0.1 into the hex form ::ffff:7f00:1.
  const embeddedHex = ip.match(/^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (embeddedHex) return fromGroups(embeddedHex[1], embeddedHex[2]);

  // 6to4 carries the v4 address in the next 32 bits.
  const sixToFour = ip.match(/^2002:([0-9a-f]{1,4}):([0-9a-f]{1,4})/);
  if (sixToFour) return fromGroups(sixToFour[1], sixToFour[2]);

  if (/^f[cd][0-9a-f]{0,2}:/.test(ip)) return true; // fc00::/7 unique local
  if (/^fe[89ab][0-9a-f]?:/.test(ip)) return true; // fe80::/10 link local
  return false;
}

export function isBlockedIp(address: string) {
  const clean = address.trim();
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(clean)) return isBlockedIpv4(clean);
  if (clean.includes(":")) return isBlockedIpv6(clean);
  return false;
}

function isIpLiteral(host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
}

/**
 * Synchronous shape checks — no DNS. Safe to call anywhere, including before
 * picking an importer.
 *
 * Decimal/octal/hex IPv4 obfuscation (http://2130706433/) needs no special case:
 * WHATWG URL already normalises those into dotted-quad form in `hostname`.
 */
export function inspectUrl(url: URL): GuardResult {
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false, reason: "protocol" };
  if (url.username || url.password) return { ok: false, reason: "credentials" };
  if (url.port && url.port !== "80" && url.port !== "443") return { ok: false, reason: "port" };

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host) return { ok: false, reason: "private-host" };
  if (BLOCKED_HOSTNAMES.has(host)) return { ok: false, reason: "private-host" };
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return { ok: false, reason: "private-host" };

  if (isIpLiteral(host)) {
    return isBlockedIp(host) ? { ok: false, reason: "ip-literal" } : { ok: true };
  }

  // Single-label names are intranet hosts ("http://wiki/").
  if (!host.includes(".")) return { ok: false, reason: "single-label" };

  return { ok: true };
}

/** inspectUrl plus DNS resolution, rejecting if ANY address is private. */
export async function assertPublicUrl(url: URL): Promise<GuardResult> {
  const shape = inspectUrl(url);
  if (!shape.ok) return shape;

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isIpLiteral(host)) return { ok: true };

  try {
    const records = await lookup(host, { all: true });
    if (!records.length) return { ok: false, reason: "dns-failed" };
    for (const record of records) {
      if (isBlockedIp(record.address)) return { ok: false, reason: "dns-private" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "dns-failed" };
  }
}
