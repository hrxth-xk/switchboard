export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export const TIMEZONE_COOKIE = "sb_tz";

/** Best-effort IANA timezone for the current JS runtime. */
export function detectTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Calendar YYYY-MM-DD in a specific IANA timezone.
 * Prefer this over startOfDay() for due-date logic across server/client.
 */
export function calendarDayKey(date: Date = new Date(), timeZone: string = detectTimeZone()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** @deprecated Prefer calendarDayKey — kept for day-boundary refresh helpers. */
export function calendarDateKey(date: Date = new Date()) {
  return calendarDayKey(date);
}

/** Parse an HTML date input value as a stable UTC-noon civil date. */
export function parseLocalDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    const fallback = new Date(value);
    return civilDateToUtcNoon(calendarDayKey(fallback));
  }
  return civilDateToUtcNoon(`${match[1]}-${match[2]}-${match[3]}`);
}

/** Store civil calendar days at UTC noon so most timezones share the same day key. */
export function civilDateToUtcNoon(dayKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return new Date(dayKey);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function addCalendarDays(from: Date, days: number, timeZone: string = detectTimeZone()) {
  const [year, month, day] = calendarDayKey(from, timeZone).split("-").map(Number);
  const civil = new Date(Date.UTC(year, month - 1, day));
  civil.setUTCDate(civil.getUTCDate() + days);
  return civilDateToUtcNoon(
    `${civil.getUTCFullYear()}-${String(civil.getUTCMonth() + 1).padStart(2, "0")}-${String(civil.getUTCDate()).padStart(2, "0")}`
  );
}

/** Negative if a is before b's calendar day, 0 if same day, positive if after. */
export function compareCalendarDays(a: Date, b: Date, timeZone: string = detectTimeZone()) {
  return calendarDayKey(a, timeZone).localeCompare(calendarDayKey(b, timeZone));
}

export function diffCalendarDays(a: Date, b: Date, timeZone: string = detectTimeZone()) {
  const [ay, am, ad] = calendarDayKey(a, timeZone).split("-").map(Number);
  const [by, bm, bd] = calendarDayKey(b, timeZone).split("-").map(Number);
  const aUtc = Date.UTC(ay, am - 1, ad);
  const bUtc = Date.UTC(by, bm - 1, bd);
  return Math.round((aUtc - bUtc) / (24 * 60 * 60 * 1000));
}

export function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

export function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const next = new Date(start);
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
}

export function startOfMonth(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfMonth(date: Date) {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return endOfDay(next);
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function daysElapsedInMonth(date: Date) {
  return date.getDate();
}

export function daysElapsedInWeek(date: Date) {
  const start = startOfWeek(date);
  const diff = startOfDay(date).getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000)) + 1;
}

export function isWithinRange(value: Date, start: Date, end: Date) {
  const time = value.getTime();
  return time >= start.getTime() && time <= end.getTime();
}
