"use client";

import { useState } from "react";
import { REVIEW_PRESET_LABELS, type ReviewPreset } from "@/lib/review-schedule";

type QuickAddReviewChipsProps = {
  onChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
  initialPreset?: ReviewPreset;
  initialCustomDate?: string;
  initialCustom?: boolean;
};

const PRESET_ORDER: ReviewPreset[] = ["tomorrow", "threeDays", "oneWeek", "twoWeeks", "oneMonth"];

export function QuickAddReviewChips({
  onChange,
  initialPreset = "oneWeek",
  initialCustomDate = "",
  initialCustom = false
}: QuickAddReviewChipsProps) {
  const [selected, setSelected] = useState<ReviewPreset | "custom">(initialCustom ? "custom" : initialPreset);
  const [customDate, setCustomDate] = useState(initialCustomDate);

  function pickPreset(preset: ReviewPreset) {
    setSelected(preset);
    onChange({ reviewPreset: preset });
  }

  function pickCustom() {
    setSelected("custom");
    onChange({ customReviewDate: customDate });
  }

  function updateCustom(value: string) {
    setCustomDate(value);
    onChange({ customReviewDate: value });
  }

  return (
    <div className="quick-add-field-block">
      <span className="quick-add-label">Revisit</span>
      <div className="quick-add-chips">
        {PRESET_ORDER.map((preset) => (
          <button
            className={`quick-add-chip${selected === preset ? " active" : ""}`}
            key={preset}
            onClick={() => pickPreset(preset)}
            type="button"
          >
            {REVIEW_PRESET_LABELS[preset]}
          </button>
        ))}
        <button
          className={`quick-add-chip${selected === "custom" ? " active" : ""}`}
          onClick={pickCustom}
          type="button"
        >
          Custom Date
        </button>
      </div>
      {selected === "custom" ? (
        <input
          className="quick-add-date"
          onChange={(event) => updateCustom(event.target.value)}
          type="date"
          value={customDate}
        />
      ) : null}
    </div>
  );
}
