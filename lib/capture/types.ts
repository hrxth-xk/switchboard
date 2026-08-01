/**
 * Capture Engine — shared types for the analyze → dispatch → extract →
 * normalize → validate → persist pipeline.
 *
 * Future inputs (URLs, extension events, paste, PDFs, screenshots, AI)
 * should map into these types without changing UI or stage contracts.
 */

/** High-level entity the capture targets. */
export type CaptureKind = "application" | "problem";

/**
 * Raw input modalities. New modalities can be added without rewriting stages —
 * analyzers classify them; extractors opt in via `supports`.
 */
export type CaptureInputKind =
  | "url"
  | "html"
  | "text"
  | "json"
  | "file"
  | "image"
  | "extension_event"
  | "unknown";

export type CaptureSourceHint =
  | "linkedin"
  | "greenhouse"
  | "lever"
  | "ashby"
  | "workday"
  | "oracle"
  | "microsoft"
  | "amazon"
  | "google"
  | "leetcode"
  | "generic"
  | "unknown";

/** Opaque payload handed to the pipeline. Callers never pass Prisma models. */
export type CaptureInput = {
  kind?: CaptureInputKind;
  /** Primary payload — URL string, pasted text, HTML, JSON string, etc. */
  value: string;
  /** Optional MIME / file name when kind is file or image. */
  mimeType?: string | null;
  fileName?: string | null;
  /** Extra context from a browser extension or AI agent. */
  metadata?: Record<string, unknown>;
};

export type CaptureAnalysis = {
  inputKind: CaptureInputKind;
  captureKind: CaptureKind | null;
  sourceHint: CaptureSourceHint;
  /** Parsed URL when value looks like one; otherwise null. */
  url: string | null;
  confidence: number;
  notes?: string[];
};

/** Partial draft produced by an extractor before normalization. */
export type ApplicationCaptureDraft = {
  company?: string | null;
  role?: string | null;
  jobId?: string | null;
  location?: string | null;
  jobUrl?: string | null;
  description?: string | null;
  notes?: string | null;
};

export type ProblemCaptureDraft = {
  name?: string | null;
  url?: string | null;
  slug?: string | null;
  topic?: string | null;
  pattern?: string | null;
  difficulty?: string | null;
  tags?: string[] | null;
  notes?: string | null;
};

export type CaptureDraft =
  | { kind: "application"; data: ApplicationCaptureDraft }
  | { kind: "problem"; data: ProblemCaptureDraft };

/** Normalized, UI/API-ready payloads (still not persisted). */
export type NormalizedApplication = {
  kind: "application";
  company: string;
  role: string;
  jobId: string | null;
  location: string | null;
  jobUrl: string;
  description: string | null;
  notes: string | null;
};

export type NormalizedProblem = {
  kind: "problem";
  name: string;
  url: string | null;
  slug: string | null;
  topic: string;
  pattern: string | null;
  difficulty: string | null;
  tags: string[];
  notes: string | null;
};

export type NormalizedCapture = NormalizedApplication | NormalizedProblem;

export type CaptureValidationIssue = {
  field: string;
  message: string;
};

export type CaptureValidationResult =
  | { ok: true; value: NormalizedCapture }
  | { ok: false; issues: CaptureValidationIssue[] };

export type CapturePersistInput = {
  userId: string;
  capture: NormalizedCapture;
};

export type CapturePersistResult =
  | { ok: true; id: string; created: boolean }
  | { ok: false; error: string };

export type CapturePipelineResult =
  | {
      ok: true;
      analysis: CaptureAnalysis;
      draft: CaptureDraft;
      normalized: NormalizedCapture;
      persisted?: CapturePersistResult;
    }
  | {
      ok: false;
      stage: "analyze" | "dispatch" | "extract" | "normalize" | "validate" | "persist";
      error: string;
      analysis?: CaptureAnalysis;
      issues?: CaptureValidationIssue[];
    };

export type CaptureRunOptions = {
  userId?: string;
  /** When true and userId is set, call the database service after validation. */
  persist?: boolean;
  /** Force capture kind when the analyzer cannot infer it. */
  preferredKind?: CaptureKind;
};

/** Stage contracts — implementors plug into the dispatcher registry. */

export type InputAnalyzer = {
  analyze: (input: CaptureInput) => Promise<CaptureAnalysis> | CaptureAnalysis;
};

export type CaptureExtractor = {
  id: string;
  /** Lower numbers run first when multiple extractors match. */
  priority?: number;
  supports: (analysis: CaptureAnalysis, input: CaptureInput) => boolean;
  extract: (input: CaptureInput, analysis: CaptureAnalysis) => Promise<CaptureDraft | null>;
};

export type CaptureDispatcher = {
  register: (extractor: CaptureExtractor) => void;
  resolve: (analysis: CaptureAnalysis, input: CaptureInput) => CaptureExtractor | null;
};

export type CaptureNormalizer = {
  normalize: (draft: CaptureDraft, analysis: CaptureAnalysis) => NormalizedCapture | null;
};

export type CaptureValidator = {
  validate: (value: NormalizedCapture) => CaptureValidationResult;
};

export type CaptureDatabaseService = {
  persistApplication: (
    userId: string,
    capture: NormalizedApplication
  ) => Promise<CapturePersistResult>;
  persistProblem: (userId: string, capture: NormalizedProblem) => Promise<CapturePersistResult>;
  persist: (input: CapturePersistInput) => Promise<CapturePersistResult>;
};
