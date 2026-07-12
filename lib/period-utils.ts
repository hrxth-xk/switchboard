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

/** Local calendar YYYY-MM-DD — use for day-boundary cache keys and comparisons. */
export function calendarDateKey(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse an HTML date input value as a local calendar day (avoids UTC midnight shift). */
export function parseLocalDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return endOfDay(new Date(value));
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return endOfDay(new Date(year, month - 1, day));
}

/** Negative if a is before b's calendar day, 0 if same day, positive if after. */
export function compareCalendarDays(a: Date, b: Date) {
  return startOfDay(a).getTime() - startOfDay(b).getTime();
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
