"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-1 w-full">
        {label && (
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            ref={ref}
            type="date"
            className={cn(
              "w-full h-12 p-3 pl-10 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-medium text-slate-900 dark:text-white disabled:opacity-50 appearance-none",
              error && "border-rose-500 focus:ring-rose-500",
              className
            )}
            {...props}
          />
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
        </div>
        {error && (
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest ml-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

DateInput.displayName = "DateInput";
