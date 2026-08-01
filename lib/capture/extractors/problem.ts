import type { CaptureAnalysis, CaptureDraft, CaptureExtractor, CaptureInput } from "@/lib/capture/types";

/**
 * Placeholder DSA / LeetCode extractor.
 * TODO: Fetch problem metadata (title, difficulty, tags, pattern)
 * or delegate to existing `lib/leetcode` without coupling the UI.
 */
export const problemUrlExtractor: CaptureExtractor = {
  id: "problem.url",
  priority: 20,
  supports(analysis) {
    return analysis.captureKind === "problem" && Boolean(analysis.url);
  },
  async extract(_input: CaptureInput, analysis: CaptureAnalysis): Promise<CaptureDraft | null> {
    // TODO: Resolve slug + problem details into ProblemCaptureDraft.
    let slug: string | null = null;
    if (analysis.url) {
      try {
        const match = new URL(analysis.url).pathname.match(/\/problems\/([a-z0-9-]+)/i);
        slug = match?.[1]?.toLowerCase() ?? null;
      } catch {
        slug = null;
      }
    }

    return {
      kind: "problem",
      data: {
        name: null,
        url: analysis.url,
        slug,
        topic: null,
        pattern: null,
        difficulty: null,
        tags: null,
        notes: null
      }
    };
  }
};
