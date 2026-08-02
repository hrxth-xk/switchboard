"use client";

import { Braces, Briefcase, FileText, FolderKanban, RotateCcw } from "lucide-react";

const ENTRIES = [
  { icon: Braces, label: "Solved · Longest Substring Without Repeating" },
  { icon: Briefcase, label: "Applied · Stripe — Backend Engineer" },
  { icon: RotateCcw, label: "Revisit due · Course Schedule" },
  { icon: FolderKanban, label: "Project session · Portfolio v2" },
  { icon: Briefcase, label: "Moved to OA · Datadog — SWE II" },
  { icon: Braces, label: "Solved · Number of Islands · confidence 4" },
  { icon: FileText, label: "Resume attached · backend-v3.pdf" },
  { icon: Briefcase, label: "Offer · Linear — Product Engineer" }
] as const;

/**
 * Seamless marquee of the kind of entries a real week produces. The list is
 * rendered twice so the loop can translate by exactly -50%.
 */
export function LandingTicker() {
  return (
    <div aria-hidden="true" className="landing-ticker">
      <div className="landing-ticker-track">
        {[0, 1].map((copy) => (
          <div className="landing-ticker-group" key={copy}>
            {ENTRIES.map(({ icon: Icon, label }) => (
              <span className="landing-ticker-item" key={`${copy}-${label}`}>
                <Icon size={14} />
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
