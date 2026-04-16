"use client";

import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface DashboardStatCardProps {
  label: string;
  subtitle?: string;
  value: string | number;
  valueColor?: string;
  trend?: {
    label: string;
    color: string;
    showPulse?: boolean;
  };
  className?: string;
}

export function DashboardStatCard({
  label,
  subtitle,
  value,
  valueColor = "text-slate-900 dark:text-white",
  trend,
  className,
}: DashboardStatCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-4 rounded-2xl shadow-sm transition-all group overflow-hidden",
      className
    )}>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between items-start gap-2">
        <span>{label}</span>
        {subtitle && (
          <span className="text-[7px] font-medium normal-case tracking-normal text-slate-400 text-right leading-tight max-w-[60%]">
            {subtitle}
          </span>
        )}
      </div>
      
      <div className={cn(
        "font-black tracking-tighter min-w-0 pr-1 leading-none shrink-0",
        typeof value === "string" && value.length > 15 ? "text-sm" : 
        typeof value === "string" && value.length > 12 ? "text-base" : "text-lg",
        valueColor
      )}>
        {typeof value === "number" ? (
          <AnimatedNumber value={value} prefix="₹" />
        ) : (
          value
        )}
      </div>

      {trend && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className={cn(
            trend.color
          )} />
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest",
            trend.color.replace('bg-', 'text-')
          )}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
}
