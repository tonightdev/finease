"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface FilterChip {
  id: string;
  label: string;
  /** Optional Tailwind bg-* color class for a colored dot, e.g. "bg-emerald-500" */
  color?: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (id: string) => void;
  /** Label for the implicit "all" chip. Defaults to "All". */
  allLabel?: string;
  className?: string;
}

/**
 * Horizontal scrollable chip list with gradient fade on the right edge to
 * indicate overflow content. Replaces hidden-scrollbar chip patterns.
 *
 * Always prepends an "All" chip (id = "all") unless you include one yourself.
 */
export function FilterChips({
  chips,
  selected,
  onSelect,
  allLabel = "All",
  className,
}: FilterChipsProps) {
  // Prepend an implicit "All" chip
  const allChip: FilterChip = { id: "all", label: allLabel };
  const allChips = [allChip, ...chips];

  return (
    <div className={cn("relative", className)}>
      {/* Scroll container */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 pr-8">
        {allChips.map((chip) => {
          const isSelected = chip.id === selected;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelect(chip.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-colors",
                isSelected
                  ? "bg-primary text-white"
                  : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500",
              )}
            >
              {chip.color && (
                <span
                  className={cn(
                    "size-1.5 rounded-full flex-shrink-0",
                    chip.color,
                  )}
                />
              )}
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Right gradient fade to hint at overflow content */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent"
      />
    </div>
  );
}

export default FilterChips;
