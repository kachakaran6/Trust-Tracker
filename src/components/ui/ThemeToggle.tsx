"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Button from "./Button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-10 h-10 p-0"
    >
      {/* Sun */}
      <Sun
        className={`absolute top-1/2 left-1/2 h-5 w-5 text-yellow-500 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"
        }`}
      />
      {/* Moon */}
      <Moon
        className={`absolute top-1/2 left-1/2 h-5 w-5 text-gray-400 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
          isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
