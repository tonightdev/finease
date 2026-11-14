import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  description?: string;
  className?: string;
}

/**
 * Reusable section header with micro-label title on the left and optional
 * action node on the right. Replaces ad-hoc `flex justify-between` patterns.
 *
 * @example
 * <SectionHeader title="Investments" action={<Button size="xs">Add</Button>} />
 * <SectionHeader title="Net Worth" description="Last 24 months" action={<Link>View all →</Link>} />
 */
export function SectionHeader({
  title,
  action,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <div className="min-w-0">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
          {title}
        </p>
        {description && (
          <p className="text-[8px] text-slate-400 font-medium mt-0.5 leading-tight">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 flex items-center">{action}</div>
      )}
    </div>
  );
}

export default SectionHeader;
