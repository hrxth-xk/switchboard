/** Trimmed copies of what Microsoft actually serves, captured 2026-08. */

export const MICROSOFT_EIGHTFOLD_URL =
  "https://apply.careers.microsoft.com/careers/job/1970393556934084?domain=microsoft.com&src=LinkedIn";

export const MICROSOFT_LEGACY_JOB_URL =
  "https://jobs.careers.microsoft.com/global/en/job/1878594/Software-Engineer-II";

export const MICROSOFT_LEGACY_SHARE_URL = "https://jobs.careers.microsoft.com/global/en/share/1878594/";

/**
 * GET /api/apply/v2/jobs/1970393556934084?domain=microsoft.com
 * Note `display_job_id` — the number a recruiter quotes — differs from `id`.
 */
export const EIGHTFOLD_API_JOB = {
  id: 1970393556934084,
  name: "Software Engineer",
  posting_name: "Software Engineer",
  location: "India, Telangana, Hyderabad",
  locations: ["India, Telangana, Hyderabad", "Hyderabad, Telangana, India"],
  department: "Software Engineering",
  business_unit: "Finance Group",
  ats_job_id: "200043540",
  display_job_id: "200043540",
  job_description: "Design, develop, deploy, and support scalable cloud-based data solutions.",
  canonicalPositionUrl: "https://apply.careers.microsoft.com/careers/job/1970393556934084"
};

/** The real job page: valid JobPosting JSON-LD, but with NO `identifier`. */
export const EIGHTFOLD_JOB_HTML = `<!doctype html><html><head>
<title>Software Engineer | Microsoft Careers</title>
<meta property="og:title" content="Software Engineer | Microsoft Careers" />
<meta property="og:site_name" content="Microsoft Careers" />
<script type="application/ld+json">
{"@context":"http://schema.org","@type":"JobPosting","datePosted":"2026-07-23T10:28:52",
"description":"Design, develop, deploy, and support scalable cloud-based data solutions.",
"employmentType":"FULL_TIME",
"hiringOrganization":{"@type":"Organization","logo":"","name":"Microsoft","sameAs":"microsoft.com"},
"inLanguage":"en",
"jobLocation":[{"@type":"Place","address":{"@type":"PostalAddress","addressCountry":{"@type":"Country","name":"IN"},"addressLocality":"Hyderabad","addressRegion":"TS,IN"}}],
"title":"Software Engineer","url":"https://apply.careers.microsoft.com/careers/job/1970393556934084"}
</script>
</head><body></body></html>`;

/**
 * Where the legacy hosts now land after two redirects. No JobPosting node, and
 * an og:title that the old importer turned into the role "Careers".
 */
export const MICROSOFT_LANDING_HTML = `<!doctype html><html><head>
<title>Careers at Microsoft</title>
<meta property="og:title" content="Careers at Microsoft" />
<meta property="og:site_name" content="Microsoft Careers" />
<meta property="og:description" content="Explore careers at Microsoft." />
</head><body></body></html>`;
