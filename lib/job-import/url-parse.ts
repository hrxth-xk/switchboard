/**
 * Everything we can learn from a job URL without touching the network.
 *
 * Client-safe: pure and synchronous, so the Quick Add sheet can fill fields the
 * instant you paste, using exactly the same rules the server will apply. Nothing
 * here may import from `net/` or `index.ts`.
 *
 * The load-bearing distinction is `jobId` vs `positionId`:
 *   jobId      the number a recruiter would quote back to you
 *   positionId the board's internal row id (e.g. an Eightfold pid)
 * These are NOT interchangeable, and conflating them is what made Microsoft
 * imports store 1970393556934084 instead of 200043540.
 */

import { companyFromHost, titleCaseSlug } from "@/lib/job-import/text";

export type BoardId =
  | "eightfold"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "oracle"
  | "linkedin"
  | "amazon"
  | "google"
  | "microsoft-legacy"
  | "generic";

export type UrlFacts = {
  board: BoardId;
  requestUrl: URL;
  /** Tracking params stripped; always carries a scheme. */
  canonicalUrl: string;
  company: string | null;
  /** ATS tenant slug — the greenhouse board, lever site, ashby org. */
  companySlug: string | null;
  role: string | null;
  /** Only set when the URL segment really is the user-visible id. */
  jobId: string | null;
  /** Board-internal id. Never promoted to jobId. */
  positionId: string | null;
  location: string | null;
  /** Eightfold `domain` param, or the registrable domain of the host. */
  domain: string | null;
};

type BoardRule = {
  board: BoardId;
  matches: (url: URL) => boolean;
  parse: (url: URL) => Partial<UrlFacts>;
};

/** Query params that are pure analytics — safe to drop from the stored URL. */
const TRACKING_PARAMS = new Set([
  "src",
  "trk",
  "trackingid",
  "refid",
  "lipi",
  "licu",
  "originalsubdomain",
  "pagenum",
  "ebp",
  "savedsearchid",
  "position",
  "jobsource",
  "recommendedflavor",
  "applyflow",
  "seq"
]);

/** Params that carry payload — dropping these would break the import. */
const PAYLOAD_PARAMS = new Set([
  "domain",
  "pid",
  "gh_jid",
  "jobid",
  "job_id",
  "currentjobid",
  "selectedjobrequid"
]);

const MULTI_PART_TLDS = new Set([
  "co.uk",
  "ac.uk",
  "org.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.in",
  "com.br",
  "co.jp",
  "com.mx",
  "co.za",
  "com.sg",
  "co.nz",
  "co.kr",
  "com.cn",
  "co.il",
  "com.tr"
]);

/** Exact host or a subdomain of it — never a substring. */
export function hostIs(url: URL, ...domains: string[]) {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return domains.some((domain) => {
    const target = domain.toLowerCase();
    return host === target || host.endsWith(`.${target}`);
  });
}

export function registrableDomain(host: string) {
  const clean = host.toLowerCase().replace(/\.$/, "");
  const parts = clean.split(".");
  if (parts.length <= 2) return clean;

  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join(".");
  return lastTwo;
}

export function normalizeJobUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

export function stripTrackingParams(url: URL) {
  const next = new URL(url.toString());
  const doomed: string[] = [];

  next.searchParams.forEach((_value, key) => {
    const lower = key.toLowerCase();
    if (PAYLOAD_PARAMS.has(lower)) return;
    if (TRACKING_PARAMS.has(lower) || lower.startsWith("utm_")) doomed.push(key);
  });

  for (const key of doomed) next.searchParams.delete(key);
  next.hash = "";
  return next;
}

function pathParts(url: URL) {
  return url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
}

/** Title slug that follows an id segment, e.g. `/job/1878594/Software-Engineer-II`. */
function slugAfter(parts: string[], anchor: string) {
  const index = parts.indexOf(anchor);
  if (index < 0) return null;
  const slug = parts[index + 1];
  if (!slug || /^\d+$/.test(slug)) return null;
  return titleCaseSlug(slug);
}

/**
 * Eightfold position id. Accepts `?pid=` and the `/careers/job/{pid}` path shape.
 *
 * NOTE: this is deliberately not `jobId`. Eightfold's pid is a snowflake-sized
 * internal key; the user-visible number lives in the API as `display_job_id`.
 */
export function eightfoldPid(url: URL): string | null {
  const query = url.searchParams.get("pid");
  if (query && /^\d{6,25}$/.test(query)) return query;

  const match = url.pathname.match(/\/careers?\/(?:job|jobs|apply|position)\/(\d{6,25})(?:\/|$)/i);
  return match?.[1] ?? null;
}

/** Hosts we know are Eightfold-powered but that aren't on the eightfold.ai domain. */
const EIGHTFOLD_HOSTS = ["eightfold.ai", "apply.careers.microsoft.com"];

const BOARD_RULES: BoardRule[] = [
  {
    board: "eightfold",
    matches(url) {
      const pid = eightfoldPid(url);
      if (hostIs(url, ...EIGHTFOLD_HOSTS)) {
        return pid !== null || url.pathname.toLowerCase().startsWith("/careers");
      }
      if (!pid) return false;
      // White-labelled tenant: require an Eightfold-shaped signal. A 13+ digit id
      // cannot be confused with an ordinary 6-9 digit requisition number.
      return url.searchParams.has("pid") || url.searchParams.has("domain") || pid.length >= 13;
    },
    parse(url) {
      const domain = url.searchParams.get("domain") || registrableDomain(url.hostname);
      return {
        positionId: eightfoldPid(url),
        jobId: null, // the pid in the path is NOT the job number
        domain,
        company: companyFromHost(domain)
      };
    }
  },
  {
    board: "microsoft-legacy",
    // apply.careers.microsoft.com is claimed by eightfold above; this covers the
    // old hosts, whose URLs now redirect to a generic landing page.
    matches: (url) => hostIs(url, "careers.microsoft.com") && eightfoldPid(url) === null,
    parse(url) {
      const parts = pathParts(url);
      const match = url.pathname.match(/\/(?:job|share)\/(\d{4,12})(?:\/|$)/i);
      const jobId = match?.[1] ?? null;

      return {
        company: "Microsoft",
        jobId,
        role: jobId ? slugAfter(parts, jobId) : null
      };
    }
  },
  {
    board: "greenhouse",
    matches: (url) => hostIs(url, "greenhouse.io") || url.searchParams.has("gh_jid"),
    parse(url) {
      const parts = pathParts(url);
      const jobsIndex = parts.findIndex((part) => part.toLowerCase() === "jobs");
      const embedded = url.searchParams.get("gh_jid");
      const pathId = jobsIndex >= 0 ? parts[jobsIndex + 1] : null;
      const jobId = embedded ?? (pathId && /^\d+$/.test(pathId) ? pathId : null);

      // Embedded boards live on the employer's own domain, so prefer the host there.
      const onGreenhouse = hostIs(url, "greenhouse.io");
      const companySlug = onGreenhouse ? (jobsIndex > 0 ? parts[jobsIndex - 1] : parts[0]) ?? null : null;

      return {
        jobId,
        companySlug,
        company: companySlug ? titleCaseSlug(companySlug) : companyFromHost(url.hostname)
      };
    }
  },
  {
    board: "lever",
    matches: (url) => hostIs(url, "lever.co"),
    parse(url) {
      const parts = pathParts(url);
      const companySlug = parts[0] ?? null;
      return {
        companySlug,
        company: companySlug ? titleCaseSlug(companySlug) : null,
        jobId: parts[1] ?? null
      };
    }
  },
  {
    board: "ashby",
    matches: (url) => hostIs(url, "ashbyhq.com"),
    parse(url) {
      const parts = pathParts(url);
      const companySlug = parts[0] ?? null;
      return {
        companySlug,
        company: companySlug ? titleCaseSlug(companySlug) : null,
        jobId: parts[1] ?? null
      };
    }
  },
  {
    board: "workday",
    matches: (url) => hostIs(url, "myworkdayjobs.com", "workdayjobs.com"),
    parse(url) {
      const parts = pathParts(url);
      const jobIndex = parts.findIndex((part) => part.toLowerCase() === "job");
      // Workday puts a location segment between `job` and the title slug.
      const titleSlug = jobIndex >= 0 ? parts[jobIndex + 2] ?? parts[jobIndex + 1] ?? null : null;
      const jobId = titleSlug?.match(/_([A-Z0-9-]+)$/i)?.[1] ?? url.pathname.match(/\/(JR\d+)\b/i)?.[1] ?? null;
      const tenant = url.hostname.split(".")[0]?.replace(/wd\d+$/i, "") ?? null;

      return {
        jobId,
        companySlug: tenant,
        company: tenant ? titleCaseSlug(tenant) : null,
        role: titleSlug ? titleCaseSlug(titleSlug.replace(/_[A-Z0-9-]+$/i, "")) : null
      };
    }
  },
  {
    board: "oracle",
    matches: (url) =>
      hostIs(url, "oraclecloud.com") ||
      (hostIs(url, "oracle.com") && /career|job|requisition/i.test(url.pathname + url.search)),
    parse(url) {
      const jobId =
        url.searchParams.get("SelectedJobReqUId") ??
        url.searchParams.get("jobId") ??
        url.pathname.match(/\/job\/([^/]+)/i)?.[1] ??
        null;
      const tenant = url.hostname.split(".")[0] ?? "";

      return {
        jobId,
        company: /oracle|fa\.ocs/i.test(tenant) ? "Oracle" : companyFromHost(url.hostname)
      };
    }
  },
  {
    board: "linkedin",
    matches: (url) => hostIs(url, "linkedin.com") && /\/jobs\//i.test(url.pathname),
    parse(url) {
      const jobId =
        url.pathname.match(/\/jobs\/view\/(\d+)/i)?.[1] ??
        url.pathname.match(/\/jobs\/(\d+)/i)?.[1] ??
        url.searchParams.get("currentJobId");

      // LinkedIn slugs look like `/jobs/view/software-engineer-at-acme-4012345678`.
      const slug = url.pathname.match(/\/jobs\/view\/([a-z0-9-]+?)-\d{6,}/i)?.[1] ?? null;
      const role = slug ? titleCaseSlug(slug.replace(/-at-[a-z0-9-]+$/i, "")) : null;

      return { jobId, role };
    }
  },
  {
    board: "amazon",
    matches: (url) => hostIs(url, "amazon.jobs"),
    parse(url) {
      const parts = pathParts(url);
      const jobId = url.pathname.match(/\/jobs\/(\d+)/i)?.[1] ?? null;
      return {
        company: "Amazon",
        jobId,
        role: jobId ? slugAfter(parts, jobId) : null
      };
    }
  },
  {
    board: "google",
    matches: (url) =>
      hostIs(url, "careers.google.com") || (hostIs(url, "google.com") && /\/jobs\//i.test(url.pathname)),
    parse(url) {
      const jobId =
        url.pathname.match(/\/jobs\/results\/(\d+)/i)?.[1] ??
        url.pathname.match(/\/jobs\/(\d+)/i)?.[1] ??
        url.searchParams.get("job_id");
      return { company: "Google", jobId };
    }
  },
  {
    board: "generic",
    matches: () => true,
    parse: (url) => ({ company: companyFromHost(url.hostname) })
  }
];

export function parseJobUrl(raw: string | URL): UrlFacts | null {
  const url = typeof raw === "string" ? normalizeJobUrl(raw) : raw;
  if (!url) return null;

  const rule = BOARD_RULES.find((item) => item.matches(url)) ?? BOARD_RULES[BOARD_RULES.length - 1];
  const parsed = rule.parse(url);
  const canonical = stripTrackingParams(url);

  const facts: UrlFacts = {
    board: rule.board,
    requestUrl: url,
    canonicalUrl: canonical.toString(),
    company: null,
    companySlug: null,
    role: null,
    jobId: null,
    positionId: null,
    location: null,
    domain: registrableDomain(url.hostname),
    ...parsed
  };

  // A jobId that merely repeats the board's internal id is not a job number.
  if (facts.jobId && facts.positionId && facts.jobId === facts.positionId) {
    facts.jobId = null;
  }

  return facts;
}

/** Cheap client-side gate before spending a server round trip. */
export function looksLikeJobUrl(raw: string) {
  const url = normalizeJobUrl(raw);
  if (!url) return false;
  if (!url.hostname.includes(".")) return false;
  return url.pathname.length > 1 || url.search.length > 1;
}
