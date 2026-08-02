/**
 * Text helpers shared by the URL parser and the HTML collectors.
 *
 * Client-safe: pure functions, no network, no node builtins. The Quick Add
 * sheet imports this directly so the instant URL fill matches the server.
 */

/**
 * Titles a page serves when it is *not* a job posting — a careers landing page,
 * a bot wall, an error. Anything in here must never reach the Role field.
 */
const BOILERPLATE_TITLES = new Set([
  "careers",
  "career",
  "jobs",
  "job",
  "job search",
  "search jobs",
  "search",
  "open positions",
  "open roles",
  "all jobs",
  "current openings",
  "job opportunities",
  "opportunities",
  "home",
  "homepage",
  "welcome",
  "sign in",
  "log in",
  "login",
  "apply",
  "apply now",
  "page not found",
  "not found",
  "404",
  "403",
  "error",
  "access denied",
  "forbidden",
  "just a moment",
  "attention required",
  "security check",
  "are you a robot",
  "loading",
  "redirecting",
  "untitled"
]);

/** Applicant tracking systems — the host names a company, not the employer. */
const ATS_DOMAINS = new Set([
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "myworkdayjobs.com",
  "workdayjobs.com",
  "eightfold.ai",
  "icims.com",
  "smartrecruiters.com",
  "workable.com",
  "breezy.hr",
  "jobvite.com",
  "taleo.net",
  "oraclecloud.com",
  "successfactors.com",
  "avature.net",
  "phenompeople.com",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com"
]);

const ROMAN_NUMERALS = new Set(["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** `senior-software-engineer-ii` → `Senior Software Engineer II`. */
export function titleCaseSlug(slug: string) {
  return slug
    .replace(/[-_+]+/g, " ")
    .replace(/%20/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (ROMAN_NUMERALS.has(word.toLowerCase()) && word.length > 1) return word.toUpperCase();
      return word.replace(/^\w/, (char) => char.toUpperCase());
    })
    .join(" ");
}

/**
 * True when a title is page furniture rather than a role.
 *
 * This is the root-cause guard for the Microsoft bug: the legacy careers URLs
 * redirect to a landing page whose `og:title` is "Careers at Microsoft", which
 * the old `cleanRoleTitle` mangled into the role "Careers".
 */
export function isBoilerplateTitle(value: string | null | undefined) {
  if (!value) return true;

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[.…!|·–—-]+$/g, "")
    .trim();

  if (normalized.length < 3 || normalized.length > 160) return true;
  if (BOILERPLATE_TITLES.has(normalized)) return true;
  // "careers at microsoft", "jobs with acme"
  if (/^(careers?|jobs?)\s+(at|with|@)\s+/.test(normalized)) return true;
  // "careers | microsoft", "jobs – acme"
  if (/^(careers?|jobs?)\s*[|·–—:-]/.test(normalized)) return true;
  if (/^(welcome to|explore|browse|search)\b/.test(normalized)) return true;

  return false;
}

/** Company names that are really site branding or a bare hostname. */
export function isBoilerplateCompany(value: string | null | undefined, host?: string) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 80) return true;
  if (BOILERPLATE_TITLES.has(normalized)) return true;
  if (/^(careers?|jobs?)\b/.test(normalized) && normalized.split(/\s+/).length === 1) return true;
  if (host && normalized === host.toLowerCase()) return true;
  if (/^https?:\/\//.test(normalized)) return true;

  return false;
}

/**
 * Trailing site branding, e.g. "SDE II | Careers at Microsoft".
 *
 * The brand word must be the whole trailing segment (optionally preceded by the
 * employer name), so a legitimate "Staff Engineer – Jobs Platform" survives.
 */
const BRAND_WORDS =
  "LinkedIn|Greenhouse|Lever|Ashby(?:HQ)?|Workday|SmartRecruiters|Eightfold|iCIMS|Taleo|Workable|Careers?|Jobs?|Job Board|Hiring|Talent";

const SITE_SUFFIX = new RegExp(
  `\\s*[|·–—-]\\s*(?:[\\w.&' ]{0,40}\\s)?(?:${BRAND_WORDS})(?:\\s+(?:at|@|with)\\s+[^|·–—]{1,40})?\\s*$`,
  "i"
);

/**
 * Normalise a page/API title into a role.
 *
 * Returns null when the title is boilerplate — callers must treat that as
 * "no role found" rather than substituting a mangled string.
 */
export function cleanRoleTitle(title: string | null | undefined, options?: { company?: string | null }) {
  if (!title) return null;

  let out = title.replace(/\s+/g, " ").trim();

  // Reject before trimming, so "Careers at Microsoft" never becomes "Careers".
  if (isBoilerplateTitle(out)) return null;

  out = out.replace(SITE_SUFFIX, "").trim();

  // Only ever strip " at <Company>" for the company we actually resolved —
  // the old blanket /\s+at\s+.+$/ ate legitimate titles like "Engineer at Scale".
  const company = options?.company?.trim();
  if (company) {
    const escaped = escapeRegExp(company);
    out = out.replace(new RegExp(`\\s+(?:at|@|with)\\s+${escaped}\\s*$`, "i"), "").trim();
    out = out.replace(new RegExp(`\\s*[|·–—-]\\s*${escaped}\\s*$`, "i"), "").trim();
  }

  out = out.replace(/\s*[|·–—-]\s*$/, "").trim();

  // And reject again, in case trimming exposed boilerplate.
  if (isBoilerplateTitle(out)) return null;

  return out || null;
}

/** Employer name from a registrable domain. Null for ATS hosts. */
export function companyFromHost(host: string | null | undefined) {
  if (!host) return null;

  const clean = host.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  if (ATS_DOMAINS.has(clean)) return null;
  for (const ats of ATS_DOMAINS) {
    if (clean.endsWith(`.${ats}`)) return null;
  }

  const label = clean.split(".")[0];
  if (!label || label.length < 2) return null;

  const name = titleCaseSlug(label);
  return isBoilerplateCompany(name, host) ? null : name;
}

export function truncateDescription(value: string, max = 2000) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}
