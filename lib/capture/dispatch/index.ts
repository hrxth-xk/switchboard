import type { CaptureAnalysis, CaptureDispatcher, CaptureExtractor, CaptureInput } from "@/lib/capture/types";

/**
 * Registry that selects the best extractor for an analyzed input.
 * Extractors register themselves; the dispatcher never knows site-specific details.
 */
export function createCaptureDispatcher(initial: CaptureExtractor[] = []): CaptureDispatcher {
  const extractors: CaptureExtractor[] = [...initial];

  return {
    register(extractor) {
      const existing = extractors.findIndex((item) => item.id === extractor.id);
      if (existing >= 0) extractors.splice(existing, 1, extractor);
      else extractors.push(extractor);
    },
    resolve(analysis, input) {
      const matches = extractors
        .filter((extractor) => extractor.supports(analysis, input))
        .sort((left, right) => (left.priority ?? 100) - (right.priority ?? 100));
      return matches[0] ?? null;
    }
  };
}

export function dispatchExtractor(
  dispatcher: CaptureDispatcher,
  analysis: CaptureAnalysis,
  input: CaptureInput
): CaptureExtractor | null {
  return dispatcher.resolve(analysis, input);
}
