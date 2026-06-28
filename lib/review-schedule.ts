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

export function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

export function addDays(from: Date, days: number) {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return endOfDay(date);
}

export function calculateNextReview(confidence: number, from = new Date()) {
  const days = CONFIDENCE_DAYS[confidence] ?? CONFIDENCE_DAYS[3];
  return addDays(from, days);
}

export function reviewDateFromPreset(preset: ReviewPreset, from = new Date()) {
  return addDays(from, REVIEW_PRESETS[preset]);
}

export function resolveNextReviewDate(
  options: { preset?: ReviewPreset; customDate?: string | Date; confidence?: number },
  from = new Date()
) {
  if (options.customDate) {
    return endOfDay(typeof options.customDate === "string" ? new Date(options.customDate) : options.customDate);
  }

  if (options.preset) {
    return reviewDateFromPreset(options.preset, from);
  }

  if (options.confidence) {
    return calculateNextReview(options.confidence, from);
  }

  return calculateNextReview(3, from);
}
