import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FinancialGoal } from "@repo/types";
import { formatCurrency } from "@/lib/utils";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: FinancialGoal | null;
  onSave: (amount: number) => void;
}

export function TopUpModal({ isOpen, onClose, goal, onSave }: TopUpModalProps) {
  const [amount, setAmount] = useState("");

  if (!goal) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Top Up Plan
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Progress</span>
                  <span className="text-xs font-bold text-primary">{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount)}</span>
                  <span className="text-sm text-slate-400">target {formatCurrency(goal.targetAmount)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Top Up Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl py-4 pl-8 pr-4 text-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  const val = parseFloat(amount);
                  if (val > 0) {
                    onSave(val);
                    setAmount("");
                  }
                }}
                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Add to Goal
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
