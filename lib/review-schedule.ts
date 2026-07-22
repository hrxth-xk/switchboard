import {
  addCalendarDays,
  civilDateToUtcNoon,
  calendarDayKey,
  parseLocalDateOnly
} from "@/lib/period-utils";

export const REVIEW_PRESETS = {
  tomorrow: 1,
  threeDays: 3,
  oneWeek: 7,
  twoWeeks: 14,
  oneMonth: 30
} as const;

export type ReviewPreset = keyof typeof REVIEW_PRESETS;

export const REVIEW_PRESET_LABELS: Record<ReviewPreset, string> = {
  tomorrow: "Tomorrow",
  threeDays: "3 Days",
  oneWeek: "1 Week",
  twoWeeks: "2 Weeks",
  oneMonth: "1 Month"
};

const CONFIDENCE_DAYS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

/** @deprecated Prefer addCalendarDays — kept for any remaining imports. */
export function endOfDay(date: Date) {
  return civilDateToUtcNoon(calendarDayKey(date));
}

export function addDays(from: Date, days: number, timeZone?: string) {
  return addCalendarDays(from, days, timeZone);
}

export function calculateNextReview(confidence: number, from = new Date(), timeZone?: string) {
  const days = CONFIDENCE_DAYS[confidence] ?? CONFIDENCE_DAYS[3];
  return addDays(from, days, timeZone);
}

export function reviewDateFromPreset(preset: ReviewPreset, from = new Date(), timeZone?: string) {
  return addDays(from, REVIEW_PRESETS[preset], timeZone);
}

export function resolveNextReviewDate(
  options: { preset?: ReviewPreset; customDate?: string | Date; confidence?: number },
  from = new Date(),
  timeZone?: string
) {
  if (options.customDate) {
    return typeof options.customDate === "string"
      ? parseLocalDateOnly(options.customDate)
      : civilDateToUtcNoon(calendarDayKey(options.customDate, timeZone));
  }

  if (options.preset) {
    return reviewDateFromPreset(options.preset, from, timeZone);
  }

  if (options.confidence) {
    return calculateNextReview(options.confidence, from, timeZone);
  }

  return calculateNextReview(3, from, timeZone);
}

/** Human label for toast copy, e.g. "Jul 29, 2026". */
export function formatRevisitScheduleLabel(value: string | Date, timeZone?: string) {
  const date =
    typeof value === "string" ? parseLocalDateOnly(value) : civilDateToUtcNoon(calendarDayKey(value, timeZone));
  return new Intl.DateTimeFormat("en", {
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

/**
 * Append next-revisit copy when the user picked a schedule themselves
 * (custom date and/or explicit preset — not auto/confidence-only).
 */
export function withNextRevisitToast(
  base: string,
  schedule: { customReviewDate?: string; reviewPreset?: ReviewPreset }
) {
  if (schedule.customReviewDate) {
    return `${base} · Next revisit scheduled for ${formatRevisitScheduleLabel(schedule.customReviewDate)}`;
  }
  if (schedule.reviewPreset) {
    return `${base} · Next revisit scheduled for ${formatRevisitScheduleLabel(
      reviewDateFromPreset(schedule.reviewPreset)
    )}`;
  }
  return base;
}
