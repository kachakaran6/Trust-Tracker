import React from "react";

export type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "purple"; // alias to primary/neutral for backwards safety

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  icon,
  className = "",
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      "bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]",
    success:
      "bg-[var(--success-subtle)] text-[var(--success)] border border-[var(--success)]/20",
    warning:
      "bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/20",
    danger:
      "bg-[var(--danger-subtle)] text-[var(--danger)] border border-[var(--danger)]/20",
    info:
      "bg-[var(--info-subtle)] text-[var(--info)] border border-[var(--info)]/20",
    primary:
      "bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/20",
    purple:
      "bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]",
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};

export default Badge;
