import type {
  ApplicationCaptureDraft,
  CaptureAnalysis,
  CaptureDraft,
  CaptureNormalizer,
  NormalizedApplication,
  NormalizedCapture,
  NormalizedProblem,
  ProblemCaptureDraft
} from "@/lib/capture/types";

function clean(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function normalizeApplication(
  data: ApplicationCaptureDraft,
  analysis: CaptureAnalysis
): NormalizedApplication | null {
  const company = clean(data.company);
  const role = clean(data.role);
  const jobUrl = clean(data.jobUrl) ?? analysis.url;

  // Foundation: allow partial drafts through as empty-string fields only when
  // both company and role exist. Callers may still surface incomplete drafts in UI.
  if (!company || !role || !jobUrl) return null;

  return {
    kind: "application",
    company,
    role,
    jobId: clean(data.jobId),
    location: clean(data.location),
    jobUrl,
    description: clean(data.description),
    notes: clean(data.notes)
  };
}

function normalizeProblem(
  data: ProblemCaptureDraft,
  analysis: CaptureAnalysis
): NormalizedProblem | null {
  const name = clean(data.name);
  const topic = clean(data.topic) ?? "Algorithms";
  if (!name) return null;

  return {
    kind: "problem",
    name,
    url: clean(data.url) ?? analysis.url,
    slug: clean(data.slug),
    topic,
    pattern: clean(data.pattern),
    difficulty: clean(data.difficulty),
    tags: (data.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    notes: clean(data.notes)
  };
}

/**
 * Converts extractor drafts into stable domain payloads.
 * Does not touch the database.
 */
export const captureNormalizer: CaptureNormalizer = {
  normalize(draft, analysis) {
    if (draft.kind === "application") return normalizeApplication(draft.data, analysis);
    return normalizeProblem(draft.data, analysis);
  }
};

export function normalizeCaptureDraft(
  draft: CaptureDraft,
  analysis: CaptureAnalysis
): NormalizedCapture | null {
  return captureNormalizer.normalize(draft, analysis);
}
