import type {
  CaptureValidationIssue,
  CaptureValidationResult,
  CaptureValidator,
  NormalizedApplication,
  NormalizedCapture,
  NormalizedProblem
} from "@/lib/capture/types";

function isValidUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateApplication(value: NormalizedApplication): CaptureValidationIssue[] {
  const issues: CaptureValidationIssue[] = [];
  if (value.company.trim().length < 2) {
    issues.push({ field: "company", message: "Company is required." });
  }
  if (value.role.trim().length < 2) {
    issues.push({ field: "role", message: "Role is required." });
  }
  if (!isValidUrl(value.jobUrl)) {
    issues.push({ field: "jobUrl", message: "Enter a valid job URL." });
  }
  return issues;
}

function validateProblem(value: NormalizedProblem): CaptureValidationIssue[] {
  const issues: CaptureValidationIssue[] = [];
  if (value.name.trim().length < 2) {
    issues.push({ field: "name", message: "Problem name is required." });
  }
  if (value.topic.trim().length < 2) {
    issues.push({ field: "topic", message: "Topic is required." });
  }
  if (value.url && !isValidUrl(value.url)) {
    issues.push({ field: "url", message: "Enter a valid problem URL." });
  }
  return issues;
}

/**
 * Validates normalized captures before persistence or UI autofill commit.
 */
export const captureValidator: CaptureValidator = {
  validate(value) {
    const issues = value.kind === "application" ? validateApplication(value) : validateProblem(value);
    if (issues.length > 0) return { ok: false, issues };
    return { ok: true, value };
  }
};

export function validateCapture(value: NormalizedCapture): CaptureValidationResult {
  return captureValidator.validate(value);
}
