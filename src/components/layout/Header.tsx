import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePageHeader } from "../../contexts/PageHeaderContext";
import { Menu } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();
  const { title, subtitle, icon } = usePageHeader();

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 gap-3 shrink-0">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 shrink-0"
      >
        <Menu size={20} />
      </button>

      {/* Page title + subtitle */}
      <div className="flex-1 min-w-0 flex items-center gap-2.5">
        {icon && (
          <span className="text-sky-500 shrink-0 flex items-center">{icon}</span>
        )}
        <div className="min-w-0">
          {title ? (
            <>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight truncate hidden sm:block">
                  {subtitle}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}

export default Header;
