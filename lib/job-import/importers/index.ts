import { amazonImporter } from "@/lib/job-import/importers/amazon";
import { eightfoldImporter } from "@/lib/job-import/importers/eightfold";
import { greenhouseImporter } from "@/lib/job-import/importers/greenhouse";
import { leverImporter } from "@/lib/job-import/importers/lever";
import { microsoftLegacyImporter } from "@/lib/job-import/importers/microsoft";
import type { JobImporter } from "@/lib/job-import/types";
import type { BoardId } from "@/lib/job-import/url-parse";

/**
 * Boards with no usable public API. All of their extraction happens in
 * url-parse.ts plus the shared JSON-LD pass, so they need no bespoke file.
 */
function urlOnlyImporter(board: BoardId): JobImporter {
  return {
    id: board,
    matches: (facts) => facts.board === board,
    allowHtmlFallback: true,
    async enrich() {
      return [];
    }
  };
}

/**
 * First match wins; generic is always last. Matching is by `facts.board`, which
 * url-parse.ts already resolved, so ordering here is mostly documentation.
 */
export const JOB_IMPORTERS: JobImporter[] = [
  eightfoldImporter,
  greenhouseImporter,
  leverImporter,
  amazonImporter,
  microsoftLegacyImporter,
  urlOnlyImporter("ashby"),
  urlOnlyImporter("workday"),
  urlOnlyImporter("oracle"),
  urlOnlyImporter("linkedin"),
  urlOnlyImporter("google"),
  urlOnlyImporter("generic")
];
