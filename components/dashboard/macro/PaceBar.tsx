type PaceBarProps = {
  percent: number;
  className?: string;
};

export function PaceBar({ percent, className = "" }: PaceBarProps) {
  const fill = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={`pace-bar${className ? ` ${className}` : ""}`} aria-hidden="true">
      <div className="pace-bar-fill" style={{ width: `${fill}%` }} />
    </div>
  );
}
