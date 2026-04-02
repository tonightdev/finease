"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/AuthProvider";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { user, updateProfile } = useAuth();

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (user) {
      updateProfile({
        preferences: {
          ...user.preferences,
          theme: newTheme
        }
      });
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-600 dark:text-slate-400" />
      <Moon className="absolute left-2 top-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-600 dark:text-slate-400" />
    </button>
  );
}
