import React from "react";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
  variant?: "underline" | "segmented";
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
  className = "",
}: TabsProps<T>) {
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 bg-[var(--surface-muted)] rounded-sm border border-[var(--border)] gap-1 overflow-x-auto max-w-full ${className}`.trim()}
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-150 whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? "bg-[var(--surface)] text-[var(--text)] shadow-sm font-semibold"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                        : "bg-[var(--surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: underline tabs
  return (
    <div
      className={`border-b border-[var(--border)] overflow-x-auto no-scrollbar ${className}`.trim()}
    >
      <nav className="flex space-x-6 min-w-max" aria-label="Tabs" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`group inline-flex items-center py-3 px-1 border-b-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer select-none ${
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)] font-semibold"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border)]"
              }`}
            >
              {tab.icon && <span className="mr-2 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-2 text-xs py-0.5 px-2 rounded-full tabular-nums ${
                    isActive
                      ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                      : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default Tabs;
