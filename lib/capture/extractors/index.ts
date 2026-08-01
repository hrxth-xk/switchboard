import { applicationUrlExtractor } from "@/lib/capture/extractors/application";
import { genericExtractor } from "@/lib/capture/extractors/generic";
import { problemUrlExtractor } from "@/lib/capture/extractors/problem";
import type { CaptureExtractor } from "@/lib/capture/types";

/** Default extractors registered with the capture dispatcher. */
export const defaultCaptureExtractors: CaptureExtractor[] = [
  applicationUrlExtractor,
  problemUrlExtractor,
  genericExtractor
];

export { applicationUrlExtractor, genericExtractor, problemUrlExtractor };
