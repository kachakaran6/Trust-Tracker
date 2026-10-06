import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  sublabel,
  showPercentage = false,
  className = "",
}) => {
  const percentage = Math.min(Math.max((value / (max || 1)) * 100, 0), 100);

  // Threshold rules from specification:
  // Normal: --primary, 80%+: --warning, 100%+: --danger
  let barColorClass = "bg-[var(--primary)]";
  if (percentage >= 100 || value >= max) {
    barColorClass = "bg-[var(--danger)]";
  } else if (percentage >= 80) {
    barColorClass = "bg-[var(--warning)]";
  }

  return (
    <div className={`w-full space-y-1.5 ${className}`.trim()}>
      {(label || showPercentage || sublabel) && (
        <div className="flex items-center justify-between text-xs font-medium text-[var(--text-muted)]">
          {label && <span className="text-[var(--text)]">{label}</span>}
          {sublabel && <span>{sublabel}</span>}
          {showPercentage && (
            <span className="tabular-nums font-semibold text-[var(--text)]">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="h-1.5 w-full bg-[var(--surface-muted)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barColorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
