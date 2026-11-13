import React from "react";
import { Settings as SettingsIcon, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/AuthProvider";
import { SettingsCard } from "./SettingsCard";
import { SettingsOptionCard } from "./SettingsOptionCard";

export function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const { user, updateProfile } = useAuth();

  const handleSelectTheme = (mode: "light" | "dark") => {
    setTheme(mode);
    if (user) {
      void updateProfile({
        preferences: {
          ...user.preferences,
          theme: mode,
        },
      });
    }
  };

  return (
    <SettingsCard
      icon={SettingsIcon}
      title="System Preferences"
      subtitle="Visual theme and regional denomination"
    >
      <div className="space-y-4">
        {/* Appearance Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-0.5">
            Appearance
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <SettingsOptionCard
              icon={Sun}
              title="Light Mode"
              subtitle="Daylight theme"
              selected={theme === "light"}
              onClick={() => handleSelectTheme("light")}
            />

            <SettingsOptionCard
              icon={Moon}
              title="Dark Mode"
              subtitle="Obsidian theme"
              selected={theme === "dark"}
              onClick={() => handleSelectTheme("dark")}
            />
          </div>
        </div>

        {/* Divider for appearance */}
        <div className="border-t border-slate-100 dark:border-white/5" />

        {/* Fiscal Currency Section */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-0.5">
            Fiscal Currency (Locked)
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="relative overflow-hidden p-2.5 sm:p-3.5 rounded-2xl border-2 border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex flex-col justify-between items-start gap-2 w-full h-full">
              <div className="flex items-start justify-between w-full gap-1.5">
                <div className="size-7 sm:size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  ₹
                </div>
                <span className="text-[7px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              <div className="min-w-0 w-full pr-1">
                <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
                  Indian Rupee
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                  INR (₹) • Default
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
