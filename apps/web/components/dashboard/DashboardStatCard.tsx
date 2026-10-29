"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface DashboardStatCardProps {
  label: string;
  subtitle?: string;
  value: string | number;
  valueColor?: string;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    color: string;
    showPulse?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function DashboardStatCard({
  label,
  subtitle,
  value,
  valueColor = "text-slate-900 dark:text-white",
  icon,
  trend,
  onClick,
  className,
}: DashboardStatCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-3.5 sm:p-4 rounded-2xl shadow-sm transition-all group overflow-hidden relative",
        onClick && "cursor-pointer hover:ring-primary/40 active:scale-[0.99]",
        className,
      )}
    >
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between items-start gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{label}</span>
        </div>
        {subtitle && (
          <span className="hidden sm:inline-block text-[8px] font-medium normal-case tracking-normal text-slate-400 text-right leading-tight max-w-[55%] truncate">
            {subtitle}
          </span>
        )}
      </div>

      <div
        data-balance="true"
        className={cn(
          "font-black tracking-tighter min-w-0 pr-1 leading-none shrink-0 cloaked-balance truncate",
          (
            typeof value === "number"
              ? Math.abs(value) >= 10000000
              : String(value).length > 14
          )
            ? "text-xs xs:text-sm sm:text-base"
            : (
                  typeof value === "number"
                    ? Math.abs(value) >= 1000000
                    : String(value).length > 11
                )
              ? "text-xs xs:text-sm sm:text-base"
              : (
                    typeof value === "number"
                      ? Math.abs(value) >= 100000
                      : String(value).length > 8
                  )
                ? "text-sm sm:text-base"
                : "text-base sm:text-lg",
          valueColor,
        )}
      >
        {typeof value === "number" ? (
          <AnimatedNumber value={value} prefix="₹" />
        ) : (
          value
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap min-w-0">
          {trend.color && (
            <div
              className={cn("size-1.5 rounded-full shrink-0", trend.color)}
            />
          )}
          <span
            className={cn(
              "text-[8px] sm:text-[9px] font-black uppercase tracking-wider truncate min-w-0 max-w-full",
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
