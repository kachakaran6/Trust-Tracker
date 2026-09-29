import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Menu } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

function Header({ setSidebarOpen }: HeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-14 flex items-center px-4 gap-3">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}

export default Header;
