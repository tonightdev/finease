"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction, Account, FinancialGoal, Category } from "@repo/types";
import { formatDate } from "@/lib/utils";

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: Account[];
  goals: FinancialGoal[];
  categories: Category[];
}

export function TransactionDetailsModal({ isOpen, onClose, transaction, accounts, goals, categories }: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const getAccountName = (id?: string) => {
    if (!id) return "Unknown";
    const acc = accounts.find(a => a.id === id);
    if (acc) return acc.name;
    const goal = goals.find(g => g.id === id);
    if (goal) return goal.name;
    return "Unknown";
  };

  const categoryObj = categories.find(c => c.id === transaction.category);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Details</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{transaction.description}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(transaction.date)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</span>
                <span className={`text-lg font-black ${transaction.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {transaction.type === 'expense' ? '-' : '+'} ₹{transaction.amount.toLocaleString()}
                </span>
                {transaction.interestAmount && (
                  <span className="text-xs text-orange-500">
                    Includes ₹{(Number(transaction.interestAmount)).toLocaleString()} Interest
                  </span>
                )}
              </div>

              <div className="w-full h-px bg-slate-100 dark:bg-border-dark my-2"></div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</span>
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryObj ? (categoryObj.color + ' bg-opacity-10 text-slate-800 dark:text-slate-300') : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-300 text-slate-800'}`}>
                  {categoryObj?.name || transaction.category}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">From Account</span>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{getAccountName(transaction.accountId)}</span>
              </div>

              {(transaction.type === 'transfer' || transaction.toAccountId) && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">To Account</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{getAccountName(transaction.toAccountId)}</span>
                </div>
              )}

              {transaction.isAutomated && (
                <div className="flex flex-col gap-1 bg-purple-50 dark:bg-purple-500/10 p-3 rounded-xl mt-4 border border-purple-100 dark:border-purple-500/20">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Recurring Settings</span>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Runs {transaction.frequency} ({transaction.recurringCount} total times)
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
