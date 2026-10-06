import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { usePageHeader } from "../../contexts/PageHeaderContext";
import { useNavigate } from "react-router-dom";
import { Icons } from "../ui/icons";
import { ThemeToggle } from "../ui/ThemeToggle";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
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
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "TT";

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] h-14 flex items-center justify-between px-4 sm:px-6 gap-3 shrink-0">
      {/* Left: Mobile sidebar toggle + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open sidebar menu"
          className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-sm cursor-pointer"
        >
          <Icons.Menu size={20} />
        </button>

        {title && (
          <h1 className="text-sm sm:text-base font-semibold text-[var(--text)] tracking-tight truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Theme toggle + User Profile Dropdown */}
      <div className="flex items-center gap-2.5 shrink-0">
        <ThemeToggle />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="User account menu"
            aria-expanded={menuOpen}
            className="w-8 h-8 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30 flex items-center justify-center text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-md z-50 overflow-hidden animate-in fade-in-50 duration-100">
              {/* User Info */}
              <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
                <p className="text-xs font-semibold text-[var(--text)] truncate">
                  {user.name || "TrustTracker User"}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                  {user.email || ""}
                </p>
              </div>

              {/* Menu Items */}
              <div className="p-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/settings");
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-muted)] rounded-xs transition-colors cursor-pointer text-left"
                >
                  <Icons.Settings size={15} />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-subtle)] rounded-xs transition-colors cursor-pointer text-left"
                >
                  <Icons.LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
