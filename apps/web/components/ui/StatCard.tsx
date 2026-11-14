"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton } from "@/components/ui/Skeleton";

export interface StatCardProps {
  label: string;
  description?: string; // always visible, never hidden on mobile!
  value: string | number;
  valueColor?: string;
  icon?: ReactNode;
  trend?: {
    label: string;
    color: string;
    showPulse?: boolean;
  };
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function StatCard({
  label,
  description,
  value,
  valueColor = "text-slate-900 dark:text-white",
  icon,
  trend,
  onClick,
  className,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-6 w-28 my-1" />
        <Skeleton className="h-2 w-20" />
      </div>
    );
  }

  const isNumeric = typeof value === "number";
  const numValue = isNumeric ? Math.abs(value as number) : 0;
  const strLen = String(value).length;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all group overflow-hidden relative flex flex-col justify-between",
        onClick && "cursor-pointer hover:border-primary/40 active:scale-[0.99]",
        className,
      )}
    >
      <div>
        {/* Header: Icon + Micro-Label */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && <span className="shrink-0">{icon}</span>}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {label}
            </span>
          </div>
        </div>

        {/* Description: ALWAYS visible on mobile & desktop, no hidden classes */}
        {description && (
          <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mb-2 leading-tight">
            {description}
          </p>
        )}

        {/* Value: Cloaked for privacy, animated for numbers */}
        <div
          data-balance="true"
          className={cn(
            "font-black tracking-tight min-w-0 leading-tight cloaked-balance",
            isNumeric && numValue >= 10000000
              ? "text-sm xs:text-base sm:text-lg"
              : isNumeric && numValue >= 1000000
                ? "text-base sm:text-xl"
                : strLen > 12
                  ? "text-sm sm:text-base"
                  : "text-lg sm:text-xl",
            valueColor,
          )}
        >
          {isNumeric ? (
            <AnimatedNumber value={value as number} prefix="₹" />
          ) : (
            value
          )}
        </div>
      </div>

      {/* Trend / Status row */}
      {trend && (
        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap min-w-0">
          {trend.color && (
            <span
              className={cn(
                "size-1.5 rounded-full shrink-0",
                trend.color,
                trend.showPulse && "animate-pulse",
              )}
            />
          )}
          <span
            className={cn(
              "text-[8px] sm:text-[9px] font-black uppercase tracking-wider min-w-0",
              trend.color
                ? trend.color.replace("bg-", "text-")
                : "text-slate-400",
            )}
          >
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
