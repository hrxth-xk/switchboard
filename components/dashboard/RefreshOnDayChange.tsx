"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { calendarDateKey } from "@/lib/period-utils";

/**
 * When the calendar day rolls over (tab left open overnight), refresh
 * server components so dashboard metrics use today's date — not yesterday's cache.
 */
export function RefreshOnDayChange() {
  const router = useRouter();
  const dayRef = useRef(calendarDateKey());

  useEffect(() => {
    function checkDay() {
      const next = calendarDateKey();
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
