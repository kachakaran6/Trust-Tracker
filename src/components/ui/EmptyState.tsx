import React from "react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-md p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-4 shadow-sm ${className}`.trim()}
    >
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[var(--surface-muted)] text-[var(--text-muted)] flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-[var(--text)] tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-sm mt-1.5 mb-6">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
