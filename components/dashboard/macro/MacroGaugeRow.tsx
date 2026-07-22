"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { EASE_OUT } from "@/lib/motion";

type MacroGaugeRowProps = {
  remaining: number;
  completed: number;
  target: number;
  percent: number;
};

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians)
  };
}

function arcPath(cx: number, cy: number, radius: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, radius, startDeg);
  const end = polar(cx, cy, radius, endDeg);
  const sweep = (endDeg - startDeg + 360) % 360;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function MacroGaugeRow({ remaining, completed, target, percent }: MacroGaugeRowProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const cx = 120;
  const cy = 120;
  const radius = 86;
  const stroke = 5;
  // Horseshoe open at the bottom — matches the reference ring
  const startDeg = 220;
  const endDeg = 140;
  const sweepDeg = (endDeg - startDeg + 360) % 360;
  const length = (2 * Math.PI * radius * sweepDeg) / 360;
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
