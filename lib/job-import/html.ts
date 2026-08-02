/**
 * Regex-based HTML extraction.
 *
 * Deliberately split by trust level: `jsonLdFields` reads a structured
 * schema.org JobPosting, while `metaContent`/`documentTitle` read page branding.
 * The previous version blended the two behind one `jobPostingFields` call, which
 * is how a careers landing page's og:title ended up in the Role field.
 */

import type { JobField } from "@/lib/job-import/types";

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

export function stripTags(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function metaContent(html: string, key: string) {
  const safeKey = escapeRegExp(key);
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${safeKey}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${safeKey}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]).trim() || null;
  }
  return null;
}

export function documentTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1]).replace(/\s+/g, " ").trim() || null : null;
}

export type JsonLdNode = Record<string, unknown>;

export function extractJsonLd(html: string): unknown[] {
  const blocks: unknown[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) blocks.push(...parsed);
      else blocks.push(parsed);
    } catch {
      // Malformed JSON-LD is common; skip it.
    }
  }

  return blocks;
}

function asNodes(value: unknown): JsonLdNode[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item) => asNodes(item));
  return [value as JsonLdNode];
}

function isJobPosting(node: JsonLdNode) {
  const type = node["@type"];
  const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  return types.some((item) => item.toLowerCase() === "jobposting");
}

export function findJobPosting(html: string): JsonLdNode | null {
  const nodes = extractJsonLd(html).flatMap(asNodes);

  for (const node of nodes) {
    if (isJobPosting(node)) return node;
    if (node["@graph"]) {
      for (const child of asNodes(node["@graph"])) {
        if (isJobPosting(child)) return child;
      }
    }
  }

  return null;
}

function organizationName(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name?: unknown }).name ?? "") || null;
  }
  return null;
}

function postingLocation(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return null;

  const first = Array.isArray(value) ? (value[0] as JsonLdNode | undefined) : (value as JsonLdNode);
  const address = first?.address;
  if (typeof address === "string") return address;
  if (!address || typeof address !== "object") return null;

  const parts = address as JsonLdNode;

  return (
    [parts.addressLocality, parts.addressRegion, organizationName(parts.addressCountry) ?? parts.addressCountry]
      .filter((part) => typeof part === "string" || typeof part === "number")
      .map(String)
      .filter(Boolean)
      .join(", ") || null
  );
}

/**
 * schema.org `identifier` is either a bare string/number or a PropertyValue.
 * `name` on a PropertyValue is usually the label ("Job ID"), so it is only
 * accepted when it actually looks like an identifier.
 */
function postingIdentifier(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") return String(value) || null;
  if (!value || typeof value !== "object") return null;

  const node = Array.isArray(value) ? (value[0] as JsonLdNode | undefined) : (value as JsonLdNode);
  if (!node) return null;

  const direct = node.value;
  if (typeof direct === "string" || typeof direct === "number") return String(direct) || null;

  const name = node.name;
  if (typeof name === "string" && /\d/.test(name)) return name;

  return null;
}

export function jsonLdFields(posting: JsonLdNode): Partial<Record<JobField, string | null>> {
  const description = posting.description;

  return {
    company: organizationName(posting.hiringOrganization),
    role: typeof posting.title === "string" ? posting.title : null,
    location: postingLocation(posting.jobLocation),
    description: typeof description === "string" ? stripTags(description) : null,
    jobId: postingIdentifier(posting.identifier)
  };
}
