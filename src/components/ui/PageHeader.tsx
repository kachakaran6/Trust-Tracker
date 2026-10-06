import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
  backAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  secondaryActions,
  className = "",
  backAction,
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[var(--border)] mb-6 ${className}`.trim()}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          {backAction && <div className="shrink-0">{backAction}</div>}
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text)] tracking-tight truncate">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryActions) && (
        <div className="flex items-center gap-2 sm:self-center shrink-0 flex-wrap">
          {secondaryActions}
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
