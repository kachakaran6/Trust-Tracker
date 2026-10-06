import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { IconButton } from "./Button";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <IconButton
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      variant="ghost"
      size="md"
      className={className}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      icon={
        isDark ? (
          <Sun className="w-5 h-5 text-[var(--text)] transition-transform duration-200" />
        ) : (
          <Moon className="w-5 h-5 text-[var(--text)] transition-transform duration-200" />
        )
      }
    />
  );
};

export default ThemeToggle;
