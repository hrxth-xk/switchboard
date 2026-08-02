/**
 * Per-field candidate collection and merge.
 *
 * Every layer (url / api / jsonld / og / title) contributes candidates; the
 * highest-confidence one per field wins. This is what lets a partial extraction
 * still be useful instead of being thrown away.
 */

import {
  cleanRoleTitle,
  isBoilerplateCompany,
  truncateDescription
} from "@/lib/job-import/text";
import type { FieldSource, JobField, Provenance, SourcedDraft } from "@/lib/job-import/types";

export type Candidate = { value: string; source: FieldSource; confidence: number };
export type CandidateSet = Record<JobField, Candidate[]>;

export const JOB_FIELDS: JobField[] = ["company", "role", "jobId", "location", "description"];

/** Fields the user is expected to fill in by hand when we can't resolve them. */
const REPORTED_FIELDS: JobField[] = ["company", "role", "jobId", "location"];

const CONFIDENCE: Record<FieldSource, Partial<Record<JobField, number>>> = {
  manual: { company: 1, role: 1, jobId: 1, location: 1, description: 1 },
  api: { jobId: 0.95, role: 0.9, location: 0.9, description: 0.88, company: 0.8 },
  jsonld: { jobId: 0.75, role: 0.85, location: 0.85, description: 0.85, company: 0.9 },
  url: { jobId: 0.7, role: 0.5, location: 0.3, description: 0, company: 0.65 },
  og: { jobId: 0, role: 0.4, location: 0.25, description: 0.45, company: 0.45 },
  title: { jobId: 0, role: 0.3, location: 0, description: 0, company: 0 }
};

/** Tie-break order when two sources land on the same confidence. */
const SOURCE_RANK: FieldSource[] = ["manual", "api", "jsonld", "url", "og", "title"];

export type AddOptions = {
  /** Scales confidence. 0 drops the candidate — used for cross-host distrust. */
  multiplier?: number;
  /** Resolved company, so role cleaning can strip " at <Company>" safely. */
  company?: string | null;
  host?: string;
  /** Board-internal id that must never be accepted as a job number. */
  positionId?: string | null;
};

export function emptyCandidateSet(): CandidateSet {
  return { company: [], role: [], jobId: [], location: [], description: [] };
}

function normalizeValue(field: JobField, raw: string, options?: AddOptions): string | null {
  const value = raw.trim();
  if (!value) return null;

  switch (field) {
    case "role":
      return cleanRoleTitle(value, { company: options?.company });

    case "company": {
      const clean = value.replace(/\s+/g, " ").trim();
      return isBoilerplateCompany(clean, options?.host) ? null : clean;
    }

    case "jobId": {
      const clean = value.replace(/\s+/g, "");
      if (!clean || clean.length > 40) return null;
      if (/^https?:/i.test(clean)) return null;
      // Belt-and-braces on the Microsoft bug: a board's internal position id is
      // not the number a recruiter quotes, even if a source hands it to us.
      if (options?.positionId && clean === options.positionId) return null;
      return clean;
    }

    case "location":
      return value.replace(/\s+/g, " ").trim().slice(0, 120) || null;

    case "description":
      return truncateDescription(value) || null;
  }
}

export function addCandidate(
  set: CandidateSet,
  field: JobField,
  raw: string | null | undefined,
  source: FieldSource,
  options?: AddOptions
) {
  if (typeof raw !== "string") return;

  const confidence = (CONFIDENCE[source][field] ?? 0) * (options?.multiplier ?? 1);
  if (confidence <= 0) return;

  const value = normalizeValue(field, raw, options);
  if (!value) return;

  set[field].push({ value, source, confidence });
}

export function addDraft(set: CandidateSet, draft: SourcedDraft, options?: AddOptions) {
  const merged: AddOptions = { ...options, multiplier: draft.multiplier ?? options?.multiplier };
  for (const field of JOB_FIELDS) {
    addCandidate(set, field, draft.fields[field], draft.source, merged);
  }
}

function bestCandidate(candidates: Candidate[]): Candidate | null {
  let best: Candidate | null = null;

  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.confidence > best.confidence) {
      best = candidate;
      continue;
    }
    if (
      candidate.confidence === best.confidence &&
      SOURCE_RANK.indexOf(candidate.source) < SOURCE_RANK.indexOf(best.source)
    ) {
      best = candidate;
    }
  }

  return best;
}

/** Current winner for a field — used to feed the resolved company into role cleaning. */
export function peek(set: CandidateSet, field: JobField): string | null {
  return bestCandidate(set[field])?.value ?? null;
}

export function resolveCandidates(set: CandidateSet) {
  const values = {} as Record<JobField, string | null>;
  const provenance: Provenance = {};

  for (const field of JOB_FIELDS) {
    const best = bestCandidate(set[field]);
    values[field] = best?.value ?? null;
    if (best) provenance[field] = { source: best.source, confidence: best.confidence };
  }

  const unresolved = REPORTED_FIELDS.filter((field) => !values[field]);

  return { values, provenance, unresolved };
}
