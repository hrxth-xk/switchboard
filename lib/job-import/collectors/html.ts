import { documentTitle, findJobPosting, jsonLdFields, metaContent } from "@/lib/job-import/html";
import { addDraft, peek, type CandidateSet } from "@/lib/job-import/provenance";
import type { FetchedPage } from "@/lib/job-import/types";
import type { UrlFacts } from "@/lib/job-import/url-parse";

/**
 * Turn a fetched page into candidates, weighted by how much the page can be
 * trusted to be the job we actually asked for.
 */
export function collectFromHtml(page: FetchedPage, set: CandidateSet, facts: UrlFacts) {
  const base = {
    company: peek(set, "company"),
    host: page.finalUrl.hostname,
    positionId: facts.positionId
  };

  const posting = findJobPosting(page.html);
  if (posting) {
    // Structured and self-identifying. A careers landing page does not carry a
    // JobPosting node, so this stays trustworthy even across a redirect.
    addDraft(set, { source: "jsonld", fields: jsonLdFields(posting) }, base);
  }

  /*
   * og:* and <title> describe the page we LANDED on. After a cross-host redirect
   * that is not the job we asked for — Microsoft's legacy URLs bounce to a
   * generic careers page whose og:title is "Careers at Microsoft", which is
   * exactly how the Role field used to end up saying "Careers".
   */
  const multiplier = page.crossHost ? 0 : 1;
  const weak = { ...base, company: peek(set, "company") };

  addDraft(
    set,
    {
      source: "og",
      multiplier,
      fields: {
        company: metaContent(page.html, "og:site_name"),
        role: metaContent(page.html, "og:title"),
        description: metaContent(page.html, "og:description") ?? metaContent(page.html, "description")
      }
    },
    weak
  );

  addDraft(set, { source: "title", multiplier, fields: { role: documentTitle(page.html) } }, weak);
}
