import type { FieldErrors } from "@/lib/api-errors";
import type { SheetMode } from "@/components/quick-add/entry-sheet-types";

export class EntrySheetSubmitError extends Error {
  fieldErrors?: FieldErrors;

  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "EntrySheetSubmitError";
    this.fieldErrors = fieldErrors;
  }
}

export function validateEntryPayload(mode: SheetMode, payload: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};

  if (mode === "problem") {
    if (!payload.name?.trim() || payload.name.trim().length < 2) {
      errors.name = "This field is required.";
    }
    if (!payload.topicPattern?.trim() || payload.topicPattern.trim().length < 2) {
      errors.topicPattern = "This field is required.";
    }
  }

  if (mode === "application") {
    if (!payload.company?.trim() || payload.company.trim().length < 2) {
      errors.company = "This field is required.";
    }
    if (!payload.role?.trim() || payload.role.trim().length < 2) {
      errors.role = "This field is required.";
    }
    if (payload.jobUrl?.trim()) {
      try {
        new URL(payload.jobUrl.trim());
      } catch {
        errors.jobUrl = "Enter a valid URL.";
      }
    }
  }

  if (mode === "project") {
    if (!payload.title?.trim() || payload.title.trim().length < 2) {
      errors.title = "This field is required.";
    }
    if (!payload.nextStep?.trim() || payload.nextStep.trim().length < 2) {
      errors.nextStep = "This field is required.";
    }
  }

  if (mode === "note") {
    if (!payload.title?.trim() || payload.title.trim().length < 2) {
      errors.title = "This field is required.";
    }
    if (!payload.tag?.trim() || payload.tag.trim().length < 2) {
      errors.tag = "This field is required.";
    }
    if (!payload.body?.trim() || payload.body.trim().length < 2) {
      errors.body = "This field is required.";
    }
  }

  return errors;
}

export function mapApiFieldErrors(fieldErrors?: FieldErrors): FieldErrors {
  if (!fieldErrors) return {};
  const mapped: FieldErrors = { ...fieldErrors };
  if (mapped.topic && !mapped.topicPattern) {
    mapped.topicPattern = mapped.topic;
    delete mapped.topic;
  }
  return mapped;
}
