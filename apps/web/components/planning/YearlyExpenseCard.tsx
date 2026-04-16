"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trash2, Pencil, Banknote } from "lucide-react";
import { YearlyExpense } from "@/store/slices/yearlySlice";

interface YearlyExpenseCardProps {
  expense: YearlyExpense;
  onEdit: (expense: YearlyExpense) => void;
  onDelete: (id: string) => void;
}

export function YearlyExpenseCard({
  expense,
  onEdit,
  onDelete,
}: YearlyExpenseCardProps) {
  const monthlyAllocation = expense.yearlyAmount / 12;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group relative p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-row gap-4 overflow-hidden"
    >
      {/* Visual Accent Layer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl transition-opacity group-hover:opacity-20" />

      {/* Left Column: Details & Icon */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-sm">
              <TrendingUp className="size-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-none">
                {expense.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-2">
                <Banknote className="size-3 text-slate-400" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {expense.accountName || "Unlinked Node"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-50 dark:border-white/5 space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
              Monthly Burden
            </span>
            <span className="text-[8px] font-bold text-slate-400">
              ₹{expense.yearlyAmount.toLocaleString()}/yr
            </span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            ₹{monthlyAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-[9px] font-bold text-primary ml-1 uppercase tracking-widest">/ month</span>
          </p>
        </div>
      </div>

      {/* Right Column: Tactical Actions */}
      <div className="flex flex-col gap-2 shrink-0 pl-4 border-l border-slate-100 dark:border-white/5 justify-center relative z-20">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(expense);
          }}
          type="button"
          className="size-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-2xl border border-slate-100 dark:border-white/5 transition-all active:scale-90 cursor-pointer shadow-sm hover:shadow-md"
          title="Update Commitment"
        >
          <Pencil className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(expense.id);
          }}
          type="button"
          className="size-10 flex items-center justify-center bg-rose-50 dark:bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 dark:border-rose-500/10 rounded-2xl transition-all active:scale-90 cursor-pointer shadow-sm hover:shadow-md"
          title="Sanitize Record"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}
