import React from "react";
import { cn } from "@/lib/utils";

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

interface MobileCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  fields: MobileCardField[];
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Generic mobile-friendly data card that shows field label → value pairs
 * stacked vertically. Intended as the mobile fallback for table rows.
 *
 * Key design principles applied:
 * - Full text, always — title and all values can wrap freely (no truncate).
 * - Actions always visible — never hidden behind hover states.
 */
export function MobileCard({
  title,
  subtitle,
  badge,
  fields,
  actions,
  onClick,
  className,
}: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm",
        onClick && "cursor-pointer active:scale-[0.99] transition-transform",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {title}
          </p>
          {subtitle && (
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>

      {/* Fields */}
      {fields.length > 0 && (
        <div className="mt-1">
          {fields.map((field, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 py-1 border-b border-slate-50 dark:border-white/5 last:border-0"
            >
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                {field.label}
              </span>
              <span
                className={cn(
                  "text-xs font-bold text-slate-900 dark:text-white text-right",
                  field.valueClassName,
                )}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/5 mt-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default MobileCard;
