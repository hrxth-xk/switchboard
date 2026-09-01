import assert from "node:assert/strict";
import test from "node:test";

import {
  calendarDayKey,
  civilDateToZonedNoon,
  zonedDaysElapsedInWeek,
  zonedDaysInMonth,
  zonedEndOfDay,
  zonedEndOfMonth,
  zonedEndOfWeek,
  zonedStartOfDay,
  zonedStartOfMonth,
  zonedStartOfWeek
} from "@/lib/period-utils";

const IST = "Asia/Kolkata";
const NY = "America/New_York";

/** The five applications logged on the IST morning of 2026-08-21. */
const AUG_21_IST_APPLICATIONS = [
  "2026-08-21T00:15:54.804Z", // 05:45 IST — Ascendion
  "2026-08-21T00:09:41.432Z", // 05:39 IST — NVIDIA
  "2026-08-20T23:49:56.649Z", // 05:19 IST — Moneyview
  "2026-08-20T23:41:08.802Z", // 05:11 IST — Mastercard
  "2026-08-20T23:31:06.027Z" // 05:01 IST — Cisco
].map((value) => new Date(value));

test("zonedStartOfDay resolves to local midnight, not the server's", () => {
  // 05:01 IST on Aug 21 belongs to the IST day that began at 18:30Z on Aug 20.
  assert.equal(
    zonedStartOfDay(new Date("2026-08-20T23:31:06.027Z"), IST).toISOString(),
    "2026-08-20T18:30:00.000Z"
  );
  assert.equal(
    zonedEndOfDay(new Date("2026-08-20T23:31:06.027Z"), IST).toISOString(),
    "2026-08-21T18:29:59.999Z"
  );
});

test("all five Aug 21 applications fall inside the IST day", () => {
  const now = new Date("2026-08-21T00:22:00.000Z"); // 05:52 IST
  const start = zonedStartOfDay(now, IST);
  const end = zonedEndOfDay(now, IST);

  const counted = AUG_21_IST_APPLICATIONS.filter(
    (applied) => applied >= start && applied <= end
  );

  assert.equal(counted.length, 5);
  // The bug this guards: a UTC day window catches only the last two.
  const utcCounted = AUG_21_IST_APPLICATIONS.filter(
    (applied) => applied >= zonedStartOfDay(now, "UTC") && applied <= zonedEndOfDay(now, "UTC")
  );
  assert.equal(utcCounted.length, 2);
});

test("week boundaries start on Monday in the target zone", () => {
  const friday = new Date("2026-08-21T00:22:00.000Z"); // Fri Aug 21, 05:52 IST

  assert.equal(calendarDayKey(zonedStartOfWeek(friday, IST), IST), "2026-08-17"); // Monday
  assert.equal(calendarDayKey(zonedEndOfWeek(friday, IST), IST), "2026-08-23"); // Sunday
  assert.equal(zonedStartOfWeek(friday, IST).toISOString(), "2026-08-16T18:30:00.000Z");
  assert.equal(zonedDaysElapsedInWeek(friday, IST), 5);
});

test("month boundaries cover the whole local month", () => {
  const now = new Date("2026-08-21T00:22:00.000Z");

  assert.equal(zonedStartOfMonth(now, IST).toISOString(), "2026-07-31T18:30:00.000Z");
  assert.equal(zonedEndOfMonth(now, IST).toISOString(), "2026-08-31T18:29:59.999Z");
  assert.equal(zonedDaysInMonth(now, IST), 31);
  assert.equal(zonedDaysInMonth(new Date("2024-02-10T00:00:00.000Z"), IST), 29);
});

test("DST transitions resolve to the correct instant", () => {
  // US DST 2026 begins Sun Mar 8. Mar 7 is EST (-05:00), Mar 9 is EDT (-04:00).
  assert.equal(
    zonedStartOfDay(new Date("2026-03-07T18:00:00.000Z"), NY).toISOString(),
    "2026-03-07T05:00:00.000Z"
  );
  assert.equal(
    zonedStartOfDay(new Date("2026-03-09T18:00:00.000Z"), NY).toISOString(),
    "2026-03-09T04:00:00.000Z"
  );
  // Midnight exists on the spring-forward day itself (the gap is 02:00–03:00).
  assert.equal(
    zonedStartOfDay(new Date("2026-03-08T18:00:00.000Z"), NY).toISOString(),
    "2026-03-08T05:00:00.000Z"
  );
});

test("civilDateToZonedNoon reads back as the day that was picked", () => {
  for (const zone of [IST, NY, "UTC", "Pacific/Kiritimati", "Pacific/Midway"]) {
    assert.equal(calendarDayKey(civilDateToZonedNoon("2026-08-21", zone), zone), "2026-08-21");
  }
});
