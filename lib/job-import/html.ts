/** Shared HTML / URL helpers for job importers. */

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

export function metaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

export function documentTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

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
      // ignore malformed JSON-LD
    }
  }

  return blocks;
}

type JsonLdNode = Record<string, unknown>;

function asNodes(value: unknown): JsonLdNode[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => asNodes(item));
  }
  return [value as JsonLdNode];
}

export function findJobPosting(html: string): JsonLdNode | null {
  const nodes = extractJsonLd(html).flatMap(asNodes);

  for (const node of nodes) {
    const type = node["@type"];
    const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
    if (types.some((item) => item.toLowerCase() === "jobposting")) return node;

    if (node["@graph"]) {
      for (const child of asNodes(node["@graph"])) {
        const childType = child["@type"];
        const childTypes = Array.isArray(childType)
          ? childType.map(String)
          : childType
            ? [String(childType)]
            : [];
        if (childTypes.some((item) => item.toLowerCase() === "jobposting")) return child;
      }
    }
  }

  return null;
}

export function jobPostingFields(html: string): {
  company: string | null;
  role: string | null;
  location: string | null;
  description: string | null;
  jobId: string | null;
} {
  const posting = findJobPosting(html);
  if (!posting) {
    return {
      company: metaContent(html, "og:site_name"),
      role: metaContent(html, "og:title") ?? documentTitle(html),
      location: null,
      description: metaContent(html, "og:description") ?? metaContent(html, "description"),
      jobId: null
    };
  }

  const org = posting.hiringOrganization;
  let company: string | null = null;
  if (typeof org === "string") company = org;
  else if (org && typeof org === "object" && "name" in org) {
    company = String((org as { name?: unknown }).name ?? "") || null;
  }

  let location: string | null = null;
  const loc = posting.jobLocation;
  if (typeof loc === "string") location = loc;
  else if (loc && typeof loc === "object") {
    const address = Array.isArray(loc)
      ? (loc[0] as JsonLdNode | undefined)?.address
      : (loc as JsonLdNode).address;
    if (typeof address === "string") location = address;
    else if (address && typeof address === "object") {
      const addr = address as JsonLdNode;
      location = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .filter(Boolean)
        .map(String)
        .join(", ");
    }
  }

  const description =
    typeof posting.description === "string" ? stripTags(posting.description).slice(0, 2000) : null;

  return {
    company,
    role: typeof posting.title === "string" ? posting.title : null,
    location: location || null,
    description,
    jobId:
      typeof posting.identifier === "string"
        ? posting.identifier
        : posting.identifier && typeof posting.identifier === "object" && "value" in posting.identifier
          ? String((posting.identifier as { value?: unknown }).value ?? "") || null
          : null
  };
}

export function titleCaseSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function cleanRoleTitle(title: string | null | undefined) {
  if (!title) return null;
  return title
    .replace(/\s*[|\-–—]\s*(LinkedIn|Greenhouse|Lever|Ashby|Workday|Careers|Jobs).*$/i, "")
    .replace(/\s+at\s+.+$/i, "")
    .trim();
}
