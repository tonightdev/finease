import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, LucideIcon } from "lucide-react";

export type SettingsTabId =
  | "profile"
  | "preferences"
  | "accounts"
  | "categories"
  | "security"
  | "identities"
  | "data";

export interface SettingsTabItem {
  id: SettingsTabId;
  label: string;
  icon: LucideIcon;
  subtitle: string;
}

export interface SettingsSidebarProps {
  tabs: SettingsTabItem[];
  activeTab: SettingsTabId;
  onTabChange: (tabId: SettingsTabId) => void;
}

export function SettingsSidebar({
  tabs,
  activeTab,
  onTabChange,
}: SettingsSidebarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view horizontally on mobile
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector<HTMLElement>(
        `[data-tab-id="${activeTab}"]`,
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [activeTab]);

  return (
    <>
      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div
        ref={scrollRef}
        className="w-full lg:hidden mb-2 overflow-x-auto no-scrollbar py-0.5"
      >
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer select-none active:scale-95 touch-manipulation ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]"
                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block w-60 xl:w-64 shrink-0 sticky top-[calc(4.5rem+env(safe-area-inset-top))]">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-2 space-y-1 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.01]"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="ml-auto shrink-0"
                  >
                    <Check className="size-3.5" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
