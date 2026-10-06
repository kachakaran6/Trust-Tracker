import React from "react";

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helperText?: React.ReactNode;
  variant?: "neutral" | "success" | "danger" | "warning";
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helperText,
  variant = "neutral",
  className = "",
  onClick,
}) => {
  const valueColorMap = {
    neutral: "text-[var(--text)]",
    success: "text-[var(--success)]",
    danger: "text-[var(--danger)]",
    warning: "text-[var(--warning)]",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-md p-4 sm:p-5 shadow-sm transition-colors ${
        onClick ? "cursor-pointer hover:bg-[var(--surface-muted)]" : ""
      } ${className}`.trim()}
    >
      <p className="text-xs sm:text-sm font-medium text-[var(--text-muted)] tracking-normal">
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-semibold tracking-tight mt-1 tabular-nums ${valueColorMap[variant]}`}
      >
        {value}
      </p>
      {helperText && (
        <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default StatCard;
