import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Icons } from "../ui/icons";
import { Modal } from "../ui/Modal";

interface BottomNavProps {
  pendingSplitCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ pendingSplitCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) return null;

  const isSuperAdmin = user?.role === "super_admin";

  const primaryTabs = [
    { name: "Dashboard", path: "/dashboard", icon: <Icons.Dashboard size={20} /> },
    { name: "Transactions", path: "/transactions", icon: <Icons.Transactions size={20} /> },
    { name: "Analytics", path: "/analytics", icon: <Icons.Analytics size={20} /> },
  ];

  const moreItems = [
    { name: "Budget", path: "/budget", icon: <Icons.Budget size={18} /> },
    { name: "Spending Forecast", path: "/predictions", icon: <Icons.Forecast size={18} /> },
    { name: "Diary Entry", path: "/manualentry", icon: <Icons.Diary size={18} /> },
    {
      name: "Groups & Splits",
      path: "/group",
      icon: <Icons.Groups size={18} />,
      badge: pendingSplitCount > 0 ? pendingSplitCount : undefined,
    },
    { name: "Loans & EMIs", path: "/loans", icon: <Icons.Loans size={18} /> },
    { name: "Subscriptions", path: "/subscriptions", icon: <Icons.Subscriptions size={18} /> },
    { name: "Debts & Lenders", path: "/debts", icon: <Icons.Debts size={18} /> },
    { name: "Settings", path: "/settings", icon: <Icons.Settings size={18} /> },
  ];

  if (isSuperAdmin) {
    moreItems.push({
      name: "Super Admin",
      path: "/admin",
      icon: <Icons.Admin size={18} />,
    });
  }

  return (
    <>
      {/* Bottom Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--surface)] border-t border-[var(--border)] safe-bottom shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-4 h-14 items-center">
          {primaryTabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "text-[var(--primary)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`
              }
            >
              {tab.icon}
              <span className="mt-0.5 tracking-tight">{tab.name}</span>
            </NavLink>
          ))}

          {/* More Sheet Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <div className="relative">
              <Icons.Menu size={20} />
              {pendingSplitCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[var(--warning)] ring-2 ring-[var(--surface)]" />
              )}
            </div>
            <span className="mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* More Navigation Bottom Sheet */}
      <Modal
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title="More Sections"
        size="md"
      >
        <div className="grid grid-cols-2 gap-2 pt-1 pb-4">
          {moreItems.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                navigate(item.path);
                setMoreOpen(false);
              }}
              className="flex items-center justify-between p-3 rounded-sm bg-[var(--surface-muted)] hover:bg-[var(--primary-subtle)] text-[var(--text)] hover:text-[var(--primary)] transition-colors text-left cursor-pointer border border-[var(--border)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 text-[var(--text-muted)]">{item.icon}</span>
                <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[var(--warning)] text-white shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-[var(--border)] pt-3 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              logout();
              setMoreOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-subtle)] rounded-sm transition-colors cursor-pointer"
          >
            <Icons.LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            TrustTracker
          </span>
        </div>
      </Modal>
    </>
  );
};

export default BottomNav;
