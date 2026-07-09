import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export function fieldErrorsFromZod(error: ZodError) {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = String(issue.path[issue.path.length - 1] ?? "form");
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export function jsonWithFieldErrors(
  message: string,
  status: number,
  fieldErrors?: FieldErrors
) {
  return NextResponse.json({ error: message, fieldErrors }, { status });
}
