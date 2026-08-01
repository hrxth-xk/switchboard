import type { CaptureAnalysis, CaptureDraft, CaptureExtractor, CaptureInput } from "@/lib/capture/types";

/**
 * Placeholder application extractor.
 * TODO: Wire board-specific fetch/parse (LinkedIn, Greenhouse, Lever, …)
 * or delegate to existing `lib/job-import` without coupling the UI.
 */
export const applicationUrlExtractor: CaptureExtractor = {
  id: "application.url",
  priority: 20,
  supports(analysis) {
    return analysis.captureKind === "application" && Boolean(analysis.url);
  },
  async extract(_input: CaptureInput, analysis: CaptureAnalysis): Promise<CaptureDraft | null> {
    // TODO: Fetch posting HTML / API and populate ApplicationCaptureDraft.
    return {
      kind: "application",
      data: {
        company: null,
        role: null,
        jobId: null,
        location: null,
        jobUrl: analysis.url,
        description: null,
        notes: null
      }
    };
  }
};
