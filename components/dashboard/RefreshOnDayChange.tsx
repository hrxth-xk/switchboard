"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { calendarDayKey, detectTimeZone, TIMEZONE_COOKIE } from "@/lib/period-utils";

function writeTimeZoneCookie(timeZone: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${TIMEZONE_COOKIE}=${encodeURIComponent(timeZone)};path=/;max-age=${maxAge};samesite=lax`;
}

/**
 * Keeps the browser IANA timezone in a cookie for server components,
 * and refreshes the app when the local calendar day changes.
 */
export function RefreshOnDayChange() {
  const router = useRouter();
  const dayRef = useRef(calendarDayKey(new Date(), detectTimeZone()));
  const zoneRef = useRef<string | null>(null);

  useEffect(() => {
    const timeZone = detectTimeZone();
    const existing = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.split("=")
      .slice(1)
      .join("=");
    const decoded = existing ? decodeURIComponent(existing) : null;

    writeTimeZoneCookie(timeZone);
    zoneRef.current = timeZone;
    dayRef.current = calendarDayKey(new Date(), timeZone);

    if (decoded !== timeZone) {
      router.refresh();
    }

    function checkDay() {
      const zone = detectTimeZone();
      if (zone !== zoneRef.current) {
        zoneRef.current = zone;
        writeTimeZoneCookie(zone);
        router.refresh();
        return;
      }

      const next = calendarDayKey(new Date(), zone);
      if (next !== dayRef.current) {
        dayRef.current = next;
        router.refresh();
      }
    }

    const interval = window.setInterval(checkDay, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkDay();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkDay);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkDay);
    };
  }, [router]);

  return null;
}
