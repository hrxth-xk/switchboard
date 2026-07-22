import { amazonImporter } from "@/lib/job-import/importers/amazon";
import { ashbyImporter } from "@/lib/job-import/importers/ashby";
import { genericImporter } from "@/lib/job-import/importers/generic";
import { googleImporter } from "@/lib/job-import/importers/google";
import { greenhouseImporter } from "@/lib/job-import/importers/greenhouse";
import { leverImporter } from "@/lib/job-import/importers/lever";
import { linkedInImporter } from "@/lib/job-import/importers/linkedin";
import { microsoftImporter } from "@/lib/job-import/importers/microsoft";
import { oracleImporter } from "@/lib/job-import/importers/oracle";
import { workdayImporter } from "@/lib/job-import/importers/workday";
import type { JobImporter } from "@/lib/job-import/types";

/** Ordered list: first match wins. Generic is always last. */
export const JOB_IMPORTERS: JobImporter[] = [
  linkedInImporter,
  greenhouseImporter,
  leverImporter,
  ashbyImporter,
  workdayImporter,
  oracleImporter,
  microsoftImporter,
  amazonImporter,
  googleImporter,
  genericImporter
];
