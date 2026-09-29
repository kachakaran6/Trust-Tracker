import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  PiggyBank,
  TrendingUp,
  Settings,
  X,
  Shield,
  Users,
  Notebook,
  Landmark,
  RefreshCw,
  Handshake,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function Sidebar({ open, setOpen }: SidebarProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  if (!user) return null;

  const mainSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { name: "Transactions", path: "/transactions", icon: <CreditCard size={16} /> },
        { name: "Analytics", path: "/analytics", icon: <BarChart2 size={16} /> },
        { name: "Budget", path: "/budget", icon: <PiggyBank size={16} /> },
        { name: "Predictions", path: "/predictions", icon: <TrendingUp size={16} /> },
        { name: "Diary Entry", path: "/manualentry", icon: <Notebook size={16} /> },
      ],
    },
    {
      title: "Shared & Splitting",
      items: [
        { name: "Groups & Splits", path: "/group", icon: <Users size={16} /> },
      ],
    },
    {
      title: "Liabilities",
      items: [
        { name: "Loans & EMIs", path: "/loans", icon: <Landmark size={16} /> },
        { name: "Subscriptions", path: "/subscriptions", icon: <RefreshCw size={16} /> },
        { name: "Debts & Lenders", path: "/debts", icon: <Handshake size={16} /> },
      ],
    },
    {
      title: "Preferences",
      items: [
        { name: "Settings", path: "/settings", icon: <Settings size={16} /> },
      ],
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${open ? "translate-x-0 shadow-xl" : "-translate-x-full"
        } md:translate-x-0 md:static flex flex-col`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Trust<span className="text-sky-500">Tracker</span>
          </span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav Links — thin scrollbar */}
      <nav
        className="flex-1 px-2 py-3 space-y-4 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
      >
        {mainSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {section.title}
            </span>
            {section.items.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg transition-all duration-150 ${isActive
                    ? "bg-sky-500 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                <span className="flex-shrink-0 opacity-80">{link.icon}</span>
                <span>{link.name}</span>
              </NavLink>
            ))}
          </div>
        ))}

        {isSuperAdmin && (
          <div className="space-y-0.5">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-purple-400">
              Admin
            </span>
            <NavLink
              to="/admin"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg transition-all ${isActive
                  ? "bg-purple-600 text-white"
                  : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                }`
              }
            >
              <Shield size={16} />
              <span>Super Admin</span>
            </NavLink>
          </div>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
