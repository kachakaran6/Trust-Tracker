import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePageHeader } from "../../contexts/PageHeaderContext";
import { useNavigate } from "react-router-dom";
import { Menu, Settings, LogOut } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { title } = usePageHeader();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 gap-3 shrink-0">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User avatar + dropdown */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white text-xs font-bold shadow-sm hover:shadow-md transition cursor-pointer"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
            {/* User info */}
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-slate-400 truncate font-mono">{user.currency || "USD"}</p>
            </div>

            {/* Menu items */}
            <div className="p-1">
              <button
                onClick={() => { navigate("/settings"); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                <Settings size={14} />
                Settings
              </button>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
