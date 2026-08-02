"use client";

import { Check, X } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

const SCATTERED = [
  "Thirty LeetCode tabs you swear you'll revisit",
  "A tracker spreadsheet you stopped updating in week two",
  "Applications you can't remember sending",
  "A notes app full of half-finished project ideas",
  "No honest answer to “was today a good day?”"
] as const;

const FOCUSED = [
  "Every solved problem comes back on schedule",
  "One pipeline from wishlist to offer",
  "The exact resume you sent, saved with the application",
  "Projects with a visible next step",
  "A gauge that tells you when you're done"
] as const;

export function ContrastSection() {
  return (
    <section className="landing-section landing-section-contrast">
      <div className="landing-container">
        <Reveal as="header" className="landing-section-head">
          <span className="landing-eyebrow">The problem</span>
          <h2 className="landing-section-title">Your job search is spread across five tools that don&apos;t talk.</h2>
          <p className="landing-section-lede">
            Progress feels invisible when it lives in tabs, spreadsheets, and screenshots. Switchboard collapses
            it into one workspace where the work you did today is impossible to miss.
          </p>
        </Reveal>

        <div className="landing-contrast">
          <Reveal className="landing-contrast-card is-before" delay={0.05}>
            <p className="landing-contrast-label">Right now</p>
            <ul className="landing-contrast-list">
              {SCATTERED.map((item) => (
                <li key={item}>
                  <span className="landing-contrast-icon is-before">
                    <X aria-hidden="true" size={13} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="landing-contrast-arrow" delay={0.12} distance={0}>
            <span aria-hidden="true">→</span>
          </Reveal>

          <Reveal className="landing-contrast-card is-after" delay={0.18}>
            <p className="landing-contrast-label">With Switchboard</p>
            <ul className="landing-contrast-list">
              {FOCUSED.map((item) => (
                <li key={item}>
                  <span className="landing-contrast-icon is-after">
                    <Check aria-hidden="true" size={13} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
