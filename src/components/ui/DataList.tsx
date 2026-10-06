import React from "react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  mobileLabel?: string;
}

export interface DataListProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyState?: React.ReactNode;
  renderMobileCard?: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function DataList<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  renderMobileCard,
  isLoading = false,
  className = "",
}: DataListProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 w-full bg-[var(--surface-muted)] rounded-sm animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <>{emptyState || null}</>;
  }

  return (
    <div className={`w-full overflow-hidden ${className}`.trim()}>
      {/* Mobile Stacked Card View (< 768px) */}
      <div className="block md:hidden space-y-3">
        {data.map((item, index) => {
          const key = keyExtractor(item, index);
          if (renderMobileCard) {
            return <React.Fragment key={key}>{renderMobileCard(item, index)}</React.Fragment>;
          }
          return (
            <div
              key={key}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-4 space-y-2.5 shadow-sm"
            >
              {columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-[var(--border)] last:border-none"
                >
                  <span className="text-[var(--text-muted)] font-medium">
                    {col.mobileLabel || col.header}
                  </span>
                  <div className="text-right text-[var(--text)] font-medium">
                    {col.cell
                      ? col.cell(item, index)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? "")
                      : null}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] ${
                    col.headerClassName || ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className="hover:bg-[var(--surface-muted)]/50 transition-colors"
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-4 py-3.5 text-sm text-[var(--text)] ${
                      col.className || ""
                    }`}
                  >
                    {col.cell
                      ? col.cell(item, index)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? "")
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataList;
