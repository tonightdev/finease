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
        "relative overflow-hidden group p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-start gap-3 cursor-pointer text-left w-full",
        selected
          ? "bg-primary/5 border-primary shadow-lg shadow-primary/10 scale-[1.005]"
          : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/40",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <div
        className={cn(
          "size-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
          selected
            ? "bg-primary text-white shadow-md shadow-primary/20"
            : "bg-white dark:bg-slate-800 text-slate-400",
        )}
      >
        <Icon size={22} />
      </div>

      <div className="min-w-0 pr-6">
        <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>

      {badge && <div className="mt-1">{badge}</div>}

      {selected && (
        <div className="absolute top-4 right-4">
          <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
            <Check size={12} />
          </div>
        </div>
      )}
    </button>
  );
}
