"use client";

import { motion } from "framer-motion";
import { Wallet, Layers, Check } from "lucide-react";

interface YearlyBurdenCardProps {
  name: string;
  monthlyAmount: number;
  balance?: number;
  count?: number;
  isSelected?: boolean;
  isAll?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export function YearlyBurdenCard({
  name,
  monthlyAmount,
  balance = 0,
  count,
  isSelected = false,
  isAll = false,
  onClick,
  icon,
}: YearlyBurdenCardProps) {
  const isHealthy = isAll || balance >= monthlyAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between select-none ${
        isSelected
          ? "bg-white dark:bg-slate-900 border-primary ring-2 ring-primary/20 dark:ring-primary/40 shadow-md"
          : "bg-white/90 dark:bg-slate-900/80 border-slate-100 dark:border-white/5 shadow-xs hover:border-slate-300 dark:hover:border-white/15 hover:shadow-md"
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] transition-all duration-300 ${
          isSelected
            ? "bg-gradient-to-r from-primary via-indigo-500 to-emerald-400"
            : "bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-white/10"
        }`}
      />

      {/* Card Header: Icon, Name & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? "bg-primary text-white shadow-xs"
                : isAll
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : isHealthy
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                    : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
            }`}
          >
            {icon ? (
              icon
            ) : isAll ? (
              <Layers className="size-4" />
            ) : (
              <Wallet className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <h4
              className={`text-xs font-black uppercase tracking-tight truncate leading-tight transition-colors ${
                isSelected
                  ? "text-primary"
                  : "text-slate-900 dark:text-white group-hover:text-primary"
              }`}
              title={name}
            >
              {name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {count !== undefined && (
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {count} {count === 1 ? "Commitment" : "Commitments"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {isSelected ? (
            <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-primary text-white flex items-center gap-0.5 shadow-xs">
              <Check className="size-2.5" />
              Active
            </span>
          ) : isAll ? (
            <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400">
              All
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                isHealthy
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {isHealthy ? "Safe" : "Refill"}
            </span>
          )}
        </div>
      </div>

      {/* Card Bottom: Reserve Amount & Balance/Yearly Total */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
            Monthly Reserve
          </span>
          <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
            ₹
            {monthlyAmount.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
            <span className="text-[8px] font-bold text-primary ml-1 uppercase tracking-widest">
              /mo
            </span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-1">
            {isAll ? "Yearly" : "Balance"}
          </span>
          <p className="text-[10px] sm:text-xs font-black text-slate-600 dark:text-slate-300 tabular-nums leading-none">
            ₹
            {(isAll ? monthlyAmount * 12 : balance).toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
