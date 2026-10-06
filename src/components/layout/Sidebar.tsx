import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Icons } from "../ui/icons";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  pendingSplitCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  setOpen,
  pendingSplitCount = 0,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const isSuperAdmin = user?.role === "super_admin";

  const navSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: <Icons.Dashboard size={18} /> },
        { name: "Transactions", path: "/transactions", icon: <Icons.Transactions size={18} /> },
        { name: "Analytics", path: "/analytics", icon: <Icons.Analytics size={18} /> },
        { name: "Budget", path: "/budget", icon: <Icons.Budget size={18} /> },
        { name: "Spending Forecast", path: "/predictions", icon: <Icons.Forecast size={18} /> },
        { name: "Diary Entry", path: "/manualentry", icon: <Icons.Diary size={18} /> },
      ],
    },
    {
      title: "Shared & Liabilities",
      items: [
        {
          name: "Groups & Splits",
          path: "/group",
          icon: <Icons.Groups size={18} />,
          badge: pendingSplitCount > 0 ? pendingSplitCount : undefined,
        },
        { name: "Loans & EMIs", path: "/loans", icon: <Icons.Loans size={18} /> },
        { name: "Subscriptions", path: "/subscriptions", icon: <Icons.Subscriptions size={18} /> },
        { name: "Debts & Lenders", path: "/debts", icon: <Icons.Debts size={18} /> },
      ],
    },
    {
      title: "System",
      items: [
        { name: "Settings", path: "/settings", icon: <Icons.Settings size={18} /> },
      ],
    },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-60 bg-[var(--surface)] border-r border-[var(--border)] transition-transform duration-200 ease-out ${
        open ? "translate-x-0 shadow-lg" : "-translate-x-full"
      } md:translate-x-0 md:static flex flex-col shrink-0`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-5 border-b border-[var(--border)] shrink-0">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded-sm"
        >
          <div className="w-7 h-7 rounded-sm bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
            <Icons.Admin size={16} />
          </div>
          <span className="font-semibold text-base text-[var(--text)] tracking-tight">
            Trust<span className="text-[var(--primary)]">Tracker</span>
          </span>
        </NavLink>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
          className="md:hidden p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-sm cursor-pointer"
        >
          <Icons.Close size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Sidebar Navigation">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {section.title}
            </span>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-medium rounded-sm transition-colors duration-150 ${
                      isActive
                        ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[var(--warning)] text-white shadow-xs shrink-0">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {isSuperAdmin && (
          <div className="space-y-1 pt-1 border-t border-[var(--border)]">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Administration
            </span>
            <div className="space-y-0.5 pt-1">
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-sm transition-colors ${
                    isActive
                      ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                  }`
                }
              >
                <Icons.Admin size={18} />
                <span>Super Admin</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
