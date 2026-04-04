"use client";

import { Modal } from "@/components/ui/Modal";
import { Transaction, Account, FinancialGoal, Category } from "@repo/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  goals: FinancialGoal[];
  categories: Category[];
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  goals,
  categories,
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const getAccountName = (id?: string) => {
    if (!id) return "Unknown";
    const acc = accounts.find((a) => a.id === id);
    if (acc) return acc.name;
    const goal = goals.find((g) => g.id === id);
    if (goal) return goal.name;
    return "Unknown";
  };

  const categoryObj = categories.find((c) => c.id === transaction.category);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Details"
      maxWidth="max-w-sm"
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          Dismiss
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Description
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">
            {transaction.description}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Timeline
          </span>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {formatDate(transaction.date)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Value Impact
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span
              className={`text-2xl font-black tracking-tighter ${transaction.type === "expense" ? "text-rose-500" : transaction.type === "transfer" ? "text-slate-500" : "text-emerald-500"}`}
            >
              ₹{transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              {transaction.type}
            </span>
          </div>
          {transaction.interestAmount && (
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded w-fit mt-1">
              Incl. ₹{Number(transaction.interestAmount).toLocaleString()} Cost
            </span>
          )}
          {transaction.balanceAfter !== undefined && (
            <div className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/10 w-fit">
              Balance: ₹{transaction.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div className="h-px bg-slate-50 dark:bg-white/5 my-2"></div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[120px] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Category
            </span>
            <span
              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest w-fit ${categoryObj ? categoryObj.color + " bg-opacity-10" : "bg-slate-100 dark:bg-slate-800"}`}
            >
              {categoryObj?.name || transaction.category}
            </span>
          </div>
          <div className="flex-1 min-w-[120px] flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Flow
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {getAccountName(transaction.accountId)}
            </span>
          </div>
        </div>

        {(transaction.type === "transfer" || transaction.toAccountId) && (
          <div className="flex flex-col gap-0.5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Destination
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {getAccountName(transaction.toAccountId)}
            </span>
          </div>
        )}

        {transaction.isAutomated && (
          <div className="flex flex-col gap-1.5 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">
              Automated Trace
            </span>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Cycles: {transaction.frequency} • {transaction.recurringCount}{" "}
              Total
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
