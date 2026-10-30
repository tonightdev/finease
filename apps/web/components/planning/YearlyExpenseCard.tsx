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
      whileHover={{ y: -2 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group relative p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden h-full"
    >
      {/* Visual Accent Layer */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl transition-opacity group-hover:opacity-20 pointer-events-none" />

      {/* Top Section: Title & Account */}
      <div className="space-y-1.5 relative z-10">
        <div className="flex items-start gap-2">
          <div className="size-6 sm:size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="size-3 sm:size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4
              className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-snug"
              title={expense.title}
            >
              {expense.title}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <Banknote className="size-2.5 text-slate-400 shrink-0" />
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">
                {expense.accountName || "Unlinked Node"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Monthly & Yearly amounts + Actions */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5 flex items-end justify-between gap-2 relative z-10">
        <div className="min-w-0">
          <div className="text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate">
            ₹{expense.yearlyAmount.toLocaleString("en-IN")}/yr
          </div>
          <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
            ₹
            {monthlyAllocation.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}
            <span className="text-[7px] font-bold text-primary ml-1 uppercase tracking-widest">
              /mo
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(expense);
            }}
            type="button"
            className="size-7 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-white/5 transition-all active:scale-90 cursor-pointer"
            title="Edit"
          >
            <Pencil className="size-3" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(expense.id);
            }}
            type="button"
            className="size-7 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 dark:border-rose-500/20 rounded-lg transition-all active:scale-90 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
