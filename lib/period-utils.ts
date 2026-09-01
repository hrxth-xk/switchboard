/**
 * Runtime-local start of day.
 *
 * WARNING: resolves in the JS runtime's timezone. Correct in client components
 * (runtime-local *is* the user's zone there); never use it for server-side
 * aggregation — the server runs in UTC. Use zonedStartOfDay() instead.
 */
export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

/** Runtime-local end of day. Same warning as startOfDay(). */
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

/**
 * Move a YYYY-MM-DD key by whole days. Pure civil arithmetic — no instant is
 * involved, so it cannot drift across a zone boundary.
 */
export function shiftDayKey(dayKey: string, days: number) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const civil = new Date(Date.UTC(year, month - 1, day));
  civil.setUTCDate(civil.getUTCDate() + days);
  return `${civil.getUTCFullYear()}-${String(civil.getUTCMonth() + 1).padStart(2, "0")}-${String(civil.getUTCDate()).padStart(2, "0")}`;
}

/** Day-of-month from a YYYY-MM-DD key. */
export function dayNumberFromKey(dayKey: string) {
  return Number(dayKey.split("-")[2]);
}

export function addCalendarDays(from: Date, days: number, timeZone: string = detectTimeZone()) {
  return civilDateToUtcNoon(shiftDayKey(calendarDayKey(from, timeZone), days));
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

/* ------------------------------------------------------------------ *
 * Timezone-aware period boundaries.
 *
 * Every server-side "was this today / this week / this month" question
 * must go through these. The runtime-local helpers above silently answer
 * in the server's zone, which puts an IST user's 05:00 entry on yesterday.
 * ------------------------------------------------------------------ */

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(date);

  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    // Some ICU builds render midnight as "24" under hour12: false.
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second")
  };
}

/** Milliseconds `timeZone` is ahead of UTC at this instant. */
function zoneOffsetMs(date: Date, timeZone: string) {
  const { year, month, day, hour, minute, second } = zoneParts(date, timeZone);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second, date.getUTCMilliseconds());
  return asUtc - date.getTime();
}

/**
 * UTC instant for a wall-clock time in `timeZone`.
 *
 * Two passes: the first offset is read at the wrong instant, the second at
 * (near enough) the right one. That second pass is what makes DST edges land
 * correctly.
 */
function zonedWallClockToInstant(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string
) {
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const firstPass = wallClock - zoneOffsetMs(new Date(wallClock), timeZone);
  return new Date(wallClock - zoneOffsetMs(new Date(firstPass), timeZone));
}

function civilParts(date: Date, timeZone: string) {
  const [year, month, day] = calendarDayKey(date, timeZone).split("-").map(Number);
  return { year, month, day };
}

/** 0 = Monday … 6 = Sunday, in `timeZone`. Matches the Monday start of startOfWeek. */
function zonedWeekdayIndex(date: Date, timeZone: string) {
  const { year, month, day } = civilParts(date, timeZone);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 0 ? 6 : weekday - 1;
}

/** UTC instant of 00:00:00.000 on this date's calendar day in `timeZone`. */
export function zonedStartOfDay(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month, day } = civilParts(date, timeZone);
  return zonedWallClockToInstant(year, month, day, 0, 0, 0, 0, timeZone);
}

/** UTC instant of 23:59:59.999 on this date's calendar day in `timeZone`. */
export function zonedEndOfDay(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month, day } = civilParts(date, timeZone);
  return zonedWallClockToInstant(year, month, day, 23, 59, 59, 999, timeZone);
}

export function zonedStartOfWeek(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month, day } = civilParts(date, timeZone);
  const civil = new Date(Date.UTC(year, month - 1, day));
  civil.setUTCDate(civil.getUTCDate() - zonedWeekdayIndex(date, timeZone));
  return zonedWallClockToInstant(
    civil.getUTCFullYear(),
    civil.getUTCMonth() + 1,
    civil.getUTCDate(),
    0,
    0,
    0,
    0,
    timeZone
  );
}

export function zonedEndOfWeek(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month, day } = civilParts(date, timeZone);
  const civil = new Date(Date.UTC(year, month - 1, day));
  civil.setUTCDate(civil.getUTCDate() - zonedWeekdayIndex(date, timeZone) + 6);
  return zonedWallClockToInstant(
    civil.getUTCFullYear(),
    civil.getUTCMonth() + 1,
    civil.getUTCDate(),
    23,
    59,
    59,
    999,
    timeZone
  );
}

export function zonedStartOfMonth(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month } = civilParts(date, timeZone);
  return zonedWallClockToInstant(year, month, 1, 0, 0, 0, 0, timeZone);
}

export function zonedEndOfMonth(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month } = civilParts(date, timeZone);
  return zonedWallClockToInstant(
    year,
    month,
    zonedDaysInMonth(date, timeZone),
    23,
    59,
    59,
    999,
    timeZone
  );
}

export function zonedDaysInMonth(date: Date, timeZone: string = detectTimeZone()) {
  const { year, month } = civilParts(date, timeZone);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function zonedDaysElapsedInMonth(date: Date, timeZone: string = detectTimeZone()) {
  return civilParts(date, timeZone).day;
}

export function zonedDaysElapsedInWeek(date: Date, timeZone: string = detectTimeZone()) {
  return zonedWeekdayIndex(date, timeZone) + 1;
}

/**
 * Anchor a civil day (from a date input) at local noon in `timeZone`.
 *
 * Noon is safely inside the civil day everywhere, so the stored instant always
 * reads back as the day that was picked — unlike civilDateToUtcNoon, which
 * drifts a day past UTC+12.
 */
export function civilDateToZonedNoon(dayKey: string, timeZone: string = detectTimeZone()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey.trim());
  if (!match) return civilDateToUtcNoon(dayKey);
  return zonedWallClockToInstant(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    12,
    0,
    0,
    0,
    timeZone
  );
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
