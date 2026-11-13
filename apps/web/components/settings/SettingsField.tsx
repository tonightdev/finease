import React from "react";
import { cn } from "@/lib/utils";

export interface SettingsFieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function SettingsField({
  label,
  hint,
  error,
  children,
  className,
}: SettingsFieldProps) {
  return (
    <div className={cn("space-y-1 sm:space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between px-0.5">
          <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            {label}
          </label>
          {hint && (
            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
      {error && (
        <p className="text-[9px] sm:text-[10px] font-bold text-rose-500 uppercase tracking-wider px-0.5">
          {error}
        </p>
      )}
    </div>
  );
}
