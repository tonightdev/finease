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
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-xs space-y-3 sm:space-y-4 animate-in fade-in duration-200",
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-2.5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="size-8 sm:size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon size={18} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-0.5 sm:pt-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {children}

      {footer && (
        <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}
