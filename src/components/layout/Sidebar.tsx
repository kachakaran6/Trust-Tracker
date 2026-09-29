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
  LogOut,
  X,
  Shield,
  Users,
  Notebook,
  Landmark,
  RefreshCw,
  Handshake,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

function Sidebar({ open, setOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  if (!user) return null;

  const mainSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
        { name: "Transactions", path: "/transactions", icon: <CreditCard size={18} /> },
        { name: "Analytics", path: "/analytics", icon: <BarChart2 size={18} /> },
        { name: "Budget", path: "/budget", icon: <PiggyBank size={18} /> },
        { name: "Predictions", path: "/predictions", icon: <TrendingUp size={18} /> },
        { name: "Diary NLP Entry", path: "/manualentry", icon: <Notebook size={18} /> },
      ],
    },
    {
      title: "Shared & Splitting",
      items: [
        { name: "Groups & Splits", path: "/group", icon: <Users size={18} />, badge: "Splitwise" },
      ],
    },
    {
      title: "Liabilities & Recurring",
      items: [
        { name: "Loans & EMIs", path: "/loans", icon: <Landmark size={18} />, badge: "New" },
        { name: "Subscriptions", path: "/subscriptions", icon: <RefreshCw size={18} />, badge: "New" },
        { name: "Debts & Lenders", path: "/debts", icon: <Handshake size={18} />, badge: "New" },
      ],
    },
    {
      title: "Preferences",
      items: [
        { name: "Settings", path: "/settings", icon: <Settings size={18} /> },
      ],
    },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } md:translate-x-0 md:static flex flex-col justify-between`}
    >
      {/* Top Brand */}
      <div>
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight leading-none block">
                Trust<span className="text-primary-600 dark:text-sky-400">Tracker</span>
              </span>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono tracking-wider font-semibold">SMART FINANCE</span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Mini Profile */}
        <div className="p-3.5 mx-3 my-2.5 bg-sky-50/60 dark:bg-slate-800/60 rounded-2xl border border-sky-100 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-primary-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {user.name || "User"}
              </p>
              <p className="text-[11px] text-sky-700 dark:text-sky-300 truncate font-mono font-medium">
                {user.currency || "USD"} • {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="px-3 py-1 space-y-3.5 max-h-[calc(100vh-250px)] overflow-y-auto">
          {mainSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </span>
              {section.items.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 ${
                      isActive
                        ? "bg-primary-600 text-white shadow-md shadow-primary-600/20 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800/80 hover:text-primary-600 dark:hover:text-sky-400"
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex-shrink-0">{link.icon}</span>
                    <span>{link.name}</span>
                  </div>
                  {link.badge && (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                    >
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {isSuperAdmin && (
            <div className="space-y-1 pt-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Administration
              </span>
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold"
                      : "text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                  }`
                }
              >
                <Shield size={18} />
                <span>Super Admin</span>
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Logout */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
