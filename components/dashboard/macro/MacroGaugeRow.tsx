"use client";

import { SemiCircleGauge } from "@/components/dashboard/macro/SemiCircleGauge";

type MacroGaugeRowProps = {
  remaining: number;
  completed: number;
  target: number;
  percent: number;
};

export function MacroGaugeRow({ remaining, completed, target, percent }: MacroGaugeRowProps) {
  return (
    <div className="macro-gauge-row">
      <div className="macro-gauge-side">
        <span className="macro-gauge-side-value">{remaining}</span>
        <span className="macro-gauge-side-label">Remaining</span>
      </div>

      <SemiCircleGauge percent={percent} completed={completed} />

      <div className="macro-gauge-side macro-gauge-side-right">
        <span className="macro-gauge-side-value">{target}</span>
        <span className="macro-gauge-side-label">Target</span>
      </div>
    </div>
  );
}
