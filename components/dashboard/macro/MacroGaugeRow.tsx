"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { arcLength, arcPath } from "@/lib/gauge-arc";
import { EASE_OUT } from "@/lib/motion";

type MacroGaugeRowProps = {
  remaining: number;
  completed: number;
  target: number;
  percent: number;
};

export function MacroGaugeRow({ remaining, completed, target, percent }: MacroGaugeRowProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const cx = 120;
  const cy = 120;
  const radius = 86;
  const stroke = 5;
  // Horseshoe open at the bottom — matches the reference ring
  const startDeg = 220;
  const endDeg = 140;
  const length = arcLength(radius, startDeg, endDeg);
  const offset = length - (clamped / 100) * length;
  const path = arcPath(cx, cy, radius, startDeg, endDeg);

  return (
    <div className="macro-gauge-row">
      <div className="macro-gauge-stage">
        <svg
          aria-hidden="true"
          className="macro-gauge-svg"
          viewBox="0 0 240 240"
        >
          <path
            d={path}
            fill="none"
            stroke="var(--line)"
            strokeLinecap="round"
            strokeWidth={stroke}
          />
          <motion.path
            animate={{ strokeDashoffset: offset }}
            className="macro-gauge-fill"
            d={path}
            fill="none"
            initial={{ strokeDashoffset: length }}
            stroke="var(--text)"
            strokeLinecap="round"
            strokeWidth={stroke}
            strokeDasharray={length}
            transition={{ duration: 0.9, ease: EASE_OUT }}
          />
        </svg>

        <div className="macro-gauge-metrics">
          <div className="macro-gauge-metric">
            <span className="macro-gauge-metric-value">
              <AnimatedNumber value={remaining} />
            </span>
            <span className="macro-gauge-metric-label">Remaining</span>
          </div>

          <div className="macro-gauge-metric macro-gauge-metric-center">
            <span className="macro-gauge-metric-value macro-gauge-metric-value-center">
              <AnimatedNumber value={completed} />
            </span>
            <span className="macro-gauge-metric-label">Completed</span>
          </div>

          <div className="macro-gauge-metric">
            <span className="macro-gauge-metric-value">
              <AnimatedNumber value={target} />
            </span>
            <span className="macro-gauge-metric-label">Target</span>
          </div>
        </div>
      </div>
    </div>
  );
}
