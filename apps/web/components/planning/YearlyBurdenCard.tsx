"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

interface YearlyBurdenCardProps {
  name: string;
  monthlyAmount: number;
  balance: number;
}

export function YearlyBurdenCard({ name, monthlyAmount, balance }: YearlyBurdenCardProps) {
  const isHealthy = balance >= monthlyAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`size-8 rounded-xl flex items-center justify-center ${isHealthy ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>
            <Wallet className="size-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
              {name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] font-black text-primary uppercase tracking-widest">
                ₹{monthlyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
              </span>
            </div>
          </div>
        </div>

        <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {isHealthy ? 'Safe' : 'Refill'}
        </div>
      </div>
    </motion.div>
  );
}
