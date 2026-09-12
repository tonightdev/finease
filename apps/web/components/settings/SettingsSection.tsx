import React from "react";
import { cn } from "@/lib/utils";

export interface SettingsSectionProps {
  children: React.ReactNode;
  tag?: string;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  children,
  tag,
  title,
  description,
  rightElement,
  className,
}: SettingsSectionProps) {
  return (
    <div
      className={cn(
        "pt-5 border-t border-slate-100 dark:border-white/5 space-y-4",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          {tag && (
            <div className="flex items-center gap-2 mb-1">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                {tag}
              </span>
            </div>
          )}
          <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
            {title}
          </h4>
          {description && (
            <p className="text-slate-500 dark:text-slate-400 text-xs font-normal mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {rightElement && <div className="shrink-0">{rightElement}</div>}
      </div>

      {children}
    </div>
  );
}
