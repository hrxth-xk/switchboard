import { cookies } from "next/headers";
import { detectTimeZone, TIMEZONE_COOKIE } from "@/lib/period-utils";

/** Read the browser timezone cookie set by TimeZoneSync; fall back to runtime TZ. */
export function getRequestTimeZone() {
  const value = cookies().get(TIMEZONE_COOKIE)?.value;
  if (!value) return detectTimeZone();

  try {
    const decoded = decodeURIComponent(value);
    // Validate by attempting to use it
    Intl.DateTimeFormat("en-US", { timeZone: decoded }).format(new Date());
    return decoded;
  } catch {
    return detectTimeZone();
  }
}
