import assert from "node:assert/strict";
import test from "node:test";

import { buildActionCards } from "@/lib/action-dashboard";
import { DEFAULT_GOALS } from "@/lib/goals";
import { buildWeeklyBreakdown } from "@/lib/weekly-breakdown";

const IST = "Asia/Kolkata";
/** 2026-08-21 05:52 IST, the moment the dashboard reported 2 of 5. */
const NOW = new Date("2026-08-21T00:22:00.000Z");

const APPLICATIONS = [
  { company: "Ascendion", appliedAt: new Date("2026-08-21T00:15:54.804Z"), status: "APPLIED" },
  { company: "NVIDIA", appliedAt: new Date("2026-08-21T00:09:41.432Z"), status: "APPLIED" },
  { company: "Moneyview", appliedAt: new Date("2026-08-20T23:49:56.649Z"), status: "APPLIED" },
  { company: "Mastercard", appliedAt: new Date("2026-08-20T23:41:08.802Z"), status: "APPLIED" },
  { company: "Cisco", appliedAt: new Date("2026-08-20T23:31:06.027Z"), status: "APPLIED" },
  { company: "American Express", appliedAt: new Date("2026-08-20T14:58:50.169Z"), status: "APPLIED" }
];

const ACTIVITIES = APPLICATIONS.map((application) => ({
  label: `Applied to ${application.company}`,
  createdAt: application.appliedAt
}));

test("the weekly grid puts all five on the IST Friday", () => {
  const week = buildWeeklyBreakdown([], APPLICATIONS, [], DEFAULT_GOALS, NOW, IST);

  const friday = week.find((day) => day.isToday);
  assert.ok(friday, "today should be inside the current week");
  assert.equal(friday.dayNumber, 21);
  assert.equal(friday.counts.applications, 5);

  // The sixth (14:58Z on Aug 20 = 20:28 IST) belongs to Thursday, not Friday.
  const thursday = week.find((day) => day.dayNumber === 20);
  assert.equal(thursday?.counts.applications, 1);

  const total = week.reduce((sum, day) => sum + day.counts.applications, 0);
  assert.equal(total, APPLICATIONS.length);
});

test("the activity card counts the whole IST day", () => {
  const metrics = { reviewDue: 0, applicationsTotal: 68, activeProjects: 1 };
  const cards = buildActionCards(ACTIVITIES, metrics, DEFAULT_GOALS, NOW, IST);

  assert.equal(cards.activity.count, 5);
  assert.equal(cards.activity.metric, "5 updates today");
});

test("a UTC server no longer changes the answer", () => {
  const ist = buildWeeklyBreakdown([], APPLICATIONS, [], DEFAULT_GOALS, NOW, IST);
  const istFriday = ist.find((day) => day.isToday)?.counts.applications;

  // Same inputs, same zone argument — the process TZ must not leak in.
  const previousTz = process.env.TZ;
  process.env.TZ = "UTC";
  const again = buildWeeklyBreakdown([], APPLICATIONS, [], DEFAULT_GOALS, NOW, IST);
  process.env.TZ = previousTz;

  assert.equal(again.find((day) => day.isToday)?.counts.applications, istFriday);
});
