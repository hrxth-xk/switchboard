"use client";

type SemiCircleGaugeProps = {
  percent: number;
  completed: number;
};

export function SemiCircleGauge({ percent, completed }: SemiCircleGaugeProps) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  const radius = 58;
  const stroke = 4;
  const circumference = Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="macro-gauge">
      <svg viewBox="0 0 180 88" className="macro-gauge-svg" aria-hidden="true">
        <path
          d="M 32 72 A 58 58 0 0 1 148 72"
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <path
          d="M 32 72 A 58 58 0 0 1 148 72"
          fill="none"
          stroke="var(--text)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="macro-gauge-fill"
        />
      </svg>
      <div className="macro-gauge-center">
        <span className="macro-gauge-value">{completed}</span>
        <span className="macro-gauge-label">Completed</span>
      </div>
    </div>
  );
}
