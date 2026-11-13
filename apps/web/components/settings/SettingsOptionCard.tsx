import React from "react";
import { LucideIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsOptionCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  selected?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SettingsOptionCard({
  title,
  subtitle,
  icon: Icon,
  selected = false,
  badge,
  onClick,
  className,
  disabled = false,
}: SettingsOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden group p-2.5 sm:p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between items-start gap-2 cursor-pointer text-left w-full h-full",
        selected
          ? "bg-primary/5 border-primary shadow-xs scale-[1.005]"
          : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <div className="flex items-start justify-between w-full gap-1.5">
        <div
          className={cn(
            "size-7 sm:size-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
            selected
              ? "bg-primary text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-400",
          )}
        >
          <Icon size={16} />
        </div>

        {selected && (
          <div className="size-4.5 rounded-full bg-primary text-white flex items-center justify-center shadow-xs shrink-0">
            <Check size={10} />
          </div>
        )}
      </div>

      <div className="min-w-0 w-full pr-1">
        <div className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
            {subtitle}
          </div>
        )}
      </div>

      {badge && <div className="mt-0.5">{badge}</div>}
    </button>
  );
}
