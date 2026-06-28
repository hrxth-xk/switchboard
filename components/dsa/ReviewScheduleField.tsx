"use client";

import { useState } from "react";
import { REVIEW_PRESET_LABELS, type ReviewPreset } from "@/lib/review-schedule";

type ReviewScheduleFieldProps = {
  currentReviewLabel?: string | null;
  defaultPreset?: ReviewPreset;
  onChange: (value: { reviewPreset?: ReviewPreset; customReviewDate?: string }) => void;
};

export function ReviewScheduleField({
  currentReviewLabel,
  defaultPreset = "oneWeek",
  onChange
}: ReviewScheduleFieldProps) {
  const [reviewPreset, setReviewPreset] = useState<ReviewPreset | "custom">(defaultPreset);
  const [customReviewDate, setCustomReviewDate] = useState("");

  function selectPreset(preset: ReviewPreset) {
    setReviewPreset(preset);
    onChange({ reviewPreset: preset });
  }

  function selectCustom() {
    setReviewPreset("custom");
    onChange({ customReviewDate });
  }

  function updateCustomDate(value: string) {
    setCustomReviewDate(value);
    onChange({ customReviewDate: value });
  }

  return (
    <div className="field wide">
      <span>Next review</span>
      {currentReviewLabel ? <p className="field-hint">Currently scheduled for {currentReviewLabel}</p> : null}
      <div className="review-presets">
        {(Object.keys(REVIEW_PRESET_LABELS) as ReviewPreset[]).map((preset) => (
          <button
            key={preset}
            className={`button ${reviewPreset === preset ? "" : "secondary"}`}
            type="button"
            onClick={() => selectPreset(preset)}
          >
            {REVIEW_PRESET_LABELS[preset]}
          </button>
        ))}
        <button
          className={`button ${reviewPreset === "custom" ? "" : "secondary"}`}
          type="button"
          onClick={selectCustom}
        >
          Custom date
        </button>
      </div>
      {reviewPreset === "custom" ? (
        <input
          className="review-custom-date"
          type="date"
          value={customReviewDate}
          onChange={(event) => updateCustomDate(event.target.value)}
        />
      ) : null}
    </div>
  );
}
