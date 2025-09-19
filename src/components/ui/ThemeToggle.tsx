"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex h-9 w-9 items-center justify-center rounded-full 
                 border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 
                 hover:bg-gray-100 dark:hover:bg-gray-700 
                 transition-colors duration-200"
    >
      {/* Sun */}
      <Sun
        className={`h-5 w-5 text-primary-600 transition-all duration-300 ${
          isDark
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />

      {/* Moon */}
      <Moon
        className={`absolute h-5 w-5 text-primary-400 transition-all duration-300 ${
          isDark
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
