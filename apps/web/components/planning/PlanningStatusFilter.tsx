"use client";

import { motion } from "framer-motion";

interface PlanningStatusFilterProps<T extends string> {
  activeStatus: T;
  onChange: (status: T) => void;
  options: {
    value: T;
    label: string;
  }[];
}

export function PlanningStatusFilter<T extends string>({
  activeStatus,
  onChange,
  options,
}: PlanningStatusFilterProps<T>) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-fit mb-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all relative ${activeStatus === option.value
            ? "text-primary "
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          <span className="relative z-10">{option.label}</span>
          {activeStatus === option.value && (
            <motion.div
              layoutId="active-planning-status"
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
