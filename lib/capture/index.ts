import { analyzeCaptureInput } from "@/lib/capture/analyze";
import { createCaptureDispatcher, dispatchExtractor } from "@/lib/capture/dispatch";
import { defaultCaptureExtractors } from "@/lib/capture/extractors";
import { normalizeCaptureDraft } from "@/lib/capture/normalizers";
import { captureDatabaseService } from "@/lib/capture/services";
import type {
  CaptureDispatcher,
  CaptureExtractor,
  CaptureInput,
  CapturePipelineResult,
  CaptureRunOptions
} from "@/lib/capture/types";
import { validateCapture } from "@/lib/capture/validators";

const defaultDispatcher = createCaptureDispatcher(defaultCaptureExtractors);

/**
 * Run the full capture pipeline.
 *
 * Stages: analyze → dispatch → extract → normalize → validate → (optional) persist.
 * Existing Job URL / LeetCode / Quick Add flows are unchanged — they do not call this yet.
 */
export async function runCapture(
  input: CaptureInput,
  options: CaptureRunOptions = {},
  dispatcher: CaptureDispatcher = defaultDispatcher
): Promise<CapturePipelineResult> {
  const analyzed = analyzeCaptureInput(input, options.preferredKind);
  const analysis = {
    ...analyzed,
    captureKind: analyzed.captureKind ?? options.preferredKind ?? null
  };

  if (!analysis.captureKind) {
    return {
      ok: false,
      stage: "analyze",
      error: "Could not determine whether this capture is an application or a DSA problem.",
      analysis
    };
  }

  const extractor = dispatchExtractor(dispatcher, analysis, input);
  if (!extractor) {
    return {
      ok: false,
      stage: "dispatch",
      error: "No capture extractor is registered for this input.",
      analysis
    };
  }

  let draft;
  try {
    draft = await extractor.extract(input, analysis);
  } catch {
    return {
      ok: false,
      stage: "extract",
      error: "Capture extraction failed.",
      analysis
    };
  }

  if (!draft) {
    return {
      ok: false,
      stage: "extract",
      error: "Capture extractor returned no data.",
      analysis
    };
  }

  const normalized = normalizeCaptureDraft(draft, analysis);
  if (!normalized) {
    return {
      ok: false,
      stage: "normalize",
      error: "Could not normalize the captured data.",
      analysis
    };
  }

  const validation = validateCapture(normalized);
  if (!validation.ok) {
    return {
      ok: false,
      stage: "validate",
      error: "Captured data failed validation.",
      analysis,
      issues: validation.issues
    };
  }

  if (options.persist) {
    if (!options.userId) {
      return {
        ok: false,
        stage: "persist",
        error: "userId is required when persist is enabled.",
        analysis
      };
    }

    const persisted = await captureDatabaseService.persist({
      userId: options.userId,
      capture: validation.value
    });

    if (!persisted.ok) {
      return {
        ok: false,
        stage: "persist",
        error: persisted.error,
        analysis
      };
    }

    return {
      ok: true,
      analysis,
      draft,
      normalized: validation.value,
      persisted
    };
  }

  return {
    ok: true,
    analysis,
    draft,
    normalized: validation.value
  };
}

/** Register an additional extractor on the default dispatcher (extension point). */
export function registerCaptureExtractor(extractor: CaptureExtractor) {
  defaultDispatcher.register(extractor);
}

export {
  analyzeCaptureInput,
  captureDatabaseService,
  createCaptureDispatcher,
  defaultCaptureExtractors,
  normalizeCaptureDraft,
  validateCapture
};

export type * from "@/lib/capture/types";
