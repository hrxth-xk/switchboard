import { Loader2 } from "lucide-react";

type SavingSpinnerProps = {
  size?: number;
  className?: string;
};

export function SavingSpinner({ size = 18, className = "" }: SavingSpinnerProps) {
  return (
    <span className="saving-spinner-wrap" aria-hidden="true">
      <Loader2
        className={`saving-spinner${className ? ` ${className}` : ""}`}
        size={size}
        strokeWidth={2.25}
      />
    </span>
  );
}
