import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SettingsCardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: LucideIcon;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function SettingsCard({
  children,
  title,
  subtitle,
  icon: Icon,
  headerAction,
  footer,
  className,
}: SettingsCardProps) {
  const hasHeader = Boolean(title || subtitle || Icon || headerAction);

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-200",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon size={18} />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {children}

      {footer && (
        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
          {footer}
        </div>
      )}
    </div>
  );
}
