"use client";

import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { Account } from "@repo/types";
import { Landmark, ShieldCheck, Wallet } from "lucide-react";

interface LiquidReservesBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  liquidCapital: number;
  monthlyExpense?: number;
}

export function LiquidReservesBreakdownModal({
  isOpen,
  onClose,
  accounts,
  liquidCapital,
  monthlyExpense = 0,
}: LiquidReservesBreakdownModalProps) {
  // Filter active liquid accounts (Bank & Cash)
  const liquidAccounts = useMemo(() => {
    return accounts
      .filter(
        (a) =>
          !a.isClosed &&
          !a.excludeFromAnalytics &&
          (a.type === "bank" || a.type === "cash") &&
          a.balance >= 0,
      )
      .sort((a, b) => b.balance - a.balance);
  }, [accounts]);

  const bankAccounts = liquidAccounts.filter((a) => a.type === "bank");
  const cashAccounts = liquidAccounts.filter((a) => a.type === "cash");

  const totalBank = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

  const runwayMonths =
    monthlyExpense > 0 ? (liquidCapital / monthlyExpense).toFixed(1) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
      bodyClassName="p-3 sm:p-4 space-y-3"
      title={
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Landmark className="size-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Liquid Reserves Breakdown
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Ready cash & bank capital accessible 24/7
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Ambient Top Glow Line */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 -mt-3 sm:-mt-4 rounded-full opacity-80" />

        {/* Hero Liquid Capital Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#091120] to-slate-900 border border-blue-500/25 p-3 sm:p-3.5 text-white shadow-lg space-y-2.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-blue-300">
            <span>Instant Liquid Capital</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="size-3" /> 0% Market Risk
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white leading-none">
                {formatCurrency(liquidCapital)}
              </div>
              <p className="text-[9px] text-blue-200/80 font-medium">
                Immediate purchasing power with zero lock-in
              </p>
            </div>

            {runwayMonths && (
              <div className="text-right bg-white/[0.06] px-2.5 py-1.5 rounded-xl border border-white/10 shrink-0 shadow-inner">
                <span className="text-[7px] font-bold text-blue-300 block uppercase">
                  Runway
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                  {runwayMonths} mo
                </span>
              </div>
            )}
          </div>

          {/* Bank vs Cash Split Chips */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10 text-[10px]">
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[8px] font-bold text-blue-300 uppercase flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-blue-500" /> Bank (
                {bankAccounts.length})
              </span>
              <span className="font-mono font-bold text-white text-[11px]">
                {formatCurrency(totalBank)}
              </span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
              <span className="text-[8px] font-bold text-emerald-300 uppercase flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Cash (
                {cashAccounts.length})
              </span>
              <span className="font-mono font-bold text-white text-[11px]">
                {formatCurrency(totalCash)}
              </span>
            </div>
          </div>
        </div>

        {/* Contributing Accounts - Dense Sleek Rows */}
        <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 p-2 sm:p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 px-0.5 pb-0.5 border-b border-slate-200/50 dark:border-white/5">
            <span>Contributing Accounts ({liquidAccounts.length})</span>
            <span>Balance & Weight</span>
          </div>

          <div className="space-y-1 max-h-[200px] overflow-y-auto pr-0.5 no-scrollbar">
            {liquidAccounts.map((acc) => {
              const share =
                liquidCapital > 0 ? (acc.balance / liquidCapital) * 100 : 0;
              const isCash = acc.type === "cash";

              return (
                <div
                  key={acc.id}
                  className="flex flex-col gap-1 py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 hover:border-blue-500/30 transition-all text-[10px]"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-1.5 flex items-center gap-1.5">
                      <div
                        className={`size-5 rounded-md flex items-center justify-center shrink-0 ${
                          isCash
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {isCash ? (
                          <Wallet className="size-3" />
                        ) : (
                          <Landmark className="size-3" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[130px] sm:max-w-[160px]">
                          {acc.name}
                        </span>
                        {acc.institutionName && (
                          <span className="text-[7px] font-bold text-slate-400 uppercase truncate block">
                            {acc.institutionName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {share.toFixed(0)}%
                      </span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Micro Allocation Progress Bar */}
                  <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCash ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.max(2, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {liquidAccounts.length === 0 && (
              <div className="text-center py-5 text-[10px] text-slate-400">
                No active liquid accounts found
              </div>
            )}
          </div>
        </div>

        {/* 1-Line Benchmark Footnote */}
        <div className="flex items-center justify-between text-[8px] text-slate-400 px-1 pt-0.5">
          <span>🛡️ Safety Buffer: Keep 3–6 months liquid</span>
          {monthlyExpense > 0 && (
            <span className="font-mono font-bold text-slate-500">
              Burn: {formatCurrency(monthlyExpense)}/mo
            </span>
          )}
        </div>
      </div>
    </Modal>
  );
}
