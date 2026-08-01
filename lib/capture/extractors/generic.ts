import type { CaptureAnalysis, CaptureDraft, CaptureExtractor, CaptureInput } from "@/lib/capture/types";

/**
 * Last-resort extractor for unclassified URL / text / HTML inputs.
 * TODO: Add generic Open Graph / JSON-LD / AI-assisted extraction.
 */
export const genericExtractor: CaptureExtractor = {
  id: "generic.fallback",
  priority: 1000,
  supports(analysis) {
    return analysis.inputKind !== "unknown";
  },
  async extract(input: CaptureInput, analysis: CaptureAnalysis): Promise<CaptureDraft | null> {
    // TODO: Implement generic extraction for paste/HTML/extension payloads.
    if (analysis.captureKind === "problem") {
      return {
        kind: "problem",
        data: {
          name: null,
          url: analysis.url,
          slug: null,
          topic: null,
          pattern: null,
          difficulty: null,
          tags: null,
          notes: input.value.slice(0, 500) || null
        }
      };
    }

    return {
      kind: "application",
      data: {
        company: null,
        role: null,
        jobId: null,
        location: null,
        jobUrl: analysis.url,
        description: null,
        notes: input.value.slice(0, 500) || null
      }
    };
  }
};
