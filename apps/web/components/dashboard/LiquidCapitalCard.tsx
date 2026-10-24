"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Account } from "@repo/types";

interface LiquidCapitalCardProps {
  accounts: Account[];
  totalBalance: number;
}

export function LiquidCapitalCard({
  accounts,
  totalBalance,
}: LiquidCapitalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (accounts.length === 0) return null;

  const primaryAccount = accounts[0];

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="size-3.5 text-rose-500" />;
      case "cash":
        return <Banknote className="size-3.5 text-emerald-500" />;
      default:
        return <Landmark className="size-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-white via-slate-50 to-blue-50/20 dark:from-[#0d1117] dark:via-[#090b0e] dark:to-blue-950/10 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all">
      {/* Sleek Minimalist Executive Bar */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs">
        {/* Left: Icon, Title & Total Reserves */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 sm:size-7 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Landmark className="size-3 sm:size-3.5" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0">
              Liquid Capital
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline shrink-0">
              • {accounts.length} Node{accounts.length !== 1 ? "s" : ""}
            </span>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
                Reserves:
              </span>
              <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-xs">
                {formatCurrency(totalBalance)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 shrink-0">
                Fluid
              </span>
            </div>
          </div>
        </div>

        {/* Right: Primary Node Highlight & Details Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {primaryAccount && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-white/5 truncate max-w-[180px]">
              <span className="truncate">Primary: {primaryAccount.name}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <span>{isExpanded ? "Less" : "Accounts"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Smooth Drawer revealing all Liquid Accounts */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] p-3.5 sm:p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-2.5 shadow-sm hover:border-blue-300 dark:hover:border-blue-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate leading-tight">
                        {acc.name}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {acc.institutionName || acc.type}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 dark:text-white block tabular-nums">
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">
                {accounts.length} active liquid node
                {accounts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
