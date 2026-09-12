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
      {/* 2-Option Theme Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SettingsOptionCard
          icon={Sun}
          title="Brilliant"
          subtitle="High-contrast daylight optimization"
          selected={theme === "light"}
          onClick={() => handleSelectTheme("light")}
        />

        <SettingsOptionCard
          icon={Moon}
          title="Abyssal"
          subtitle="Low-light OLED-ready obsidian interface"
          selected={theme === "dark"}
          onClick={() => handleSelectTheme("dark")}
        />
      </div>

      {/* Currency Configuration */}
      <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block">
          Standard Fiscal Currency (Locked)
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-4">
            <div className="size-11 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-white/5 flex items-center justify-center text-xl font-black text-primary">
              ₹
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-white block">
                Indian Rupee (INR)
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Primary localized denomination
              </span>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shrink-0">
            Active Node
          </span>
        </div>
      </div>
    </SettingsCard>
  );
}
