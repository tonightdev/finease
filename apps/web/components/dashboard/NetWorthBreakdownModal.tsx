"use client";

import { useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/utils";
import { Account } from "@repo/types";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Landmark,
  Wallet,
  TrendingUp,
  Building2,
  CreditCard,
  CircleDot,
} from "lucide-react";

interface NetWorthBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  assets: number;
  liabilities: number;
  netWorth: number;
}

export function NetWorthBreakdownModal({
  isOpen,
  onClose,
  accounts,
  assets,
  liabilities,
  netWorth,
}: NetWorthBreakdownModalProps) {
  // Filter active accounts
  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.isClosed && !a.excludeFromAnalytics),
    [accounts],
  );

  // Categorize Assets (positive or zero balances)
  const assetAccounts = useMemo(
    () =>
      activeAccounts
        .filter(
          (a) =>
            (a.type === "bank" ||
              a.type === "cash" ||
              a.type === "investment" ||
              a.type === "asset") &&
            a.balance >= 0,
        )
        .sort((a, b) => b.balance - a.balance),
    [activeAccounts],
  );

  // Categorize Liabilities (cards, debts, or negative bank balances)
  const liabilityAccounts = useMemo(
    () =>
      activeAccounts
        .filter(
          (a) =>
            a.type === "card" ||
            a.type === "debt" ||
            ((a.type === "bank" || a.type === "cash") && a.balance < 0),
        )
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [activeAccounts],
  );

  const debtRatio = assets > 0 ? (liabilities / assets) * 100 : 0;
  const equityRatio = 100 - debtRatio;

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Landmark className="size-3 text-blue-500" />;
      case "cash":
        return <Wallet className="size-3 text-emerald-500" />;
      case "investment":
        return <TrendingUp className="size-3 text-indigo-500" />;
      case "asset":
        return <Building2 className="size-3 text-amber-500" />;
      case "card":
      case "debt":
        return <CreditCard className="size-3 text-rose-500" />;
      default:
        return <CircleDot className="size-3 text-slate-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md sm:max-w-lg"
      className="p-0 overflow-hidden"
      bodyClassName="p-3 sm:p-4 space-y-3"
      title={
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
              Net Worth Breakdown
            </h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Exact formula & live portfolio balances
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Ambient Top Glow Line */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500 -mt-3 sm:-mt-4 rounded-full opacity-80" />

        {/* Hero Accounting Equation Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0c121d] to-slate-900 border border-emerald-500/25 p-3 sm:p-3.5 text-white shadow-lg space-y-2.5">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
            <span>Accounting Equation</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="size-3" /> Real-time Balanced
            </span>
          </div>

          {/* 3 Equation Value Cards */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5 text-center">
            {/* Assets */}
            <div className="flex-1 min-w-0 bg-white/[0.04] p-1.5 sm:p-2 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[8px] font-bold text-slate-300 uppercase block truncate">
                Assets ({assetAccounts.length})
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono truncate block">
                +{formatCurrency(assets)}
              </span>
            </div>

            <span className="text-sm font-black text-slate-500 shrink-0">
              −
            </span>

            {/* Liabilities */}
            <div className="flex-1 min-w-0 bg-white/[0.04] p-1.5 sm:p-2 rounded-xl border border-white/5 space-y-0.5">
              <span className="text-[8px] font-bold text-slate-300 uppercase block truncate">
                Liabilities ({liabilityAccounts.length})
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-400 font-mono truncate block">
                -{formatCurrency(liabilities)}
              </span>
            </div>

            <span className="text-sm font-black text-slate-500 shrink-0">
              =
            </span>

            {/* Net Worth Hero Result */}
            <div className="flex-1 min-w-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-1.5 sm:p-2 rounded-xl border border-emerald-500/40 space-y-0.5 shadow-inner">
              <span className="text-[8px] font-bold text-emerald-200 uppercase block truncate">
                Net Worth
              </span>
              <span className="text-xs sm:text-sm font-black text-white font-mono truncate block">
                {formatCurrency(netWorth)}
              </span>
            </div>
          </div>

          {/* Equity vs Leverage Micro Bar */}
          <div className="space-y-1 pt-0.5">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(5, Math.min(100, equityRatio))}%` }}
              />
              {debtRatio > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min(95, debtRatio)}%` }}
                />
              )}
            </div>
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
              <span className="text-emerald-400 font-mono">
                {equityRatio.toFixed(1)}% Pure Equity
              </span>
              <span className="text-rose-400 font-mono">
                {debtRatio > 0
                  ? `${debtRatio.toFixed(1)}% Debt Ratio`
                  : "0% Debt"}
              </span>
            </div>
          </div>
        </div>

        {/* Dense Split View: Assets vs Liabilities Side-by-Side on Desktop, Stacked on Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* ASSETS CONTAINER */}
          <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 p-2 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-0.5 pb-0.5 border-b border-slate-200/50 dark:border-white/5">
              <span>Assets ({assetAccounts.length})</span>
              <span className="font-mono">+{formatCurrency(assets)}</span>
            </div>

            <div className="space-y-1 max-h-[150px] sm:max-h-[190px] overflow-y-auto pr-0.5 no-scrollbar">
              {assetAccounts.map((acc) => {
                const share = assets > 0 ? (acc.balance / assets) * 100 : 0;
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-all text-[10px]"
                  >
                    <div className="min-w-0 pr-1.5 flex items-center gap-1.5">
                      <div className="size-5 rounded-md bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[90px] sm:max-w-[105px]">
                          {acc.name}
                        </span>
                        {acc.institutionName && (
                          <span className="text-[7px] font-bold text-slate-400 uppercase truncate block">
                            {acc.institutionName.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(acc.balance)}
                      </div>
                      <span className="text-[7px] font-bold text-slate-400 font-mono">
                        {share.toFixed(0)}% share
                      </span>
                    </div>
                  </div>
                );
              })}

              {assetAccounts.length === 0 && (
                <div className="text-center py-4 text-[10px] text-slate-400">
                  No active assets recorded
                </div>
              )}
            </div>
          </div>

          {/* LIABILITIES CONTAINER */}
          <div className="rounded-2xl bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 p-2 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 px-0.5 pb-0.5 border-b border-slate-200/50 dark:border-white/5">
              <span>Liabilities ({liabilityAccounts.length})</span>
              <span className="font-mono">
                {liabilities > 0 ? `-${formatCurrency(liabilities)}` : "₹0"}
              </span>
            </div>

            <div className="space-y-1 max-h-[150px] sm:max-h-[190px] overflow-y-auto pr-0.5 no-scrollbar">
              {liabilityAccounts.map((acc) => {
                const share =
                  liabilities > 0
                    ? (Math.abs(acc.balance) / liabilities) * 100
                    : 0;
                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 hover:border-rose-500/40 transition-all text-[10px]"
                  >
                    <div className="min-w-0 pr-1.5 flex items-center gap-1.5">
                      <div className="size-5 rounded-md bg-rose-500/10 flex items-center justify-center shrink-0">
                        <CreditCard className="size-3 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[90px] sm:max-w-[105px]">
                          {acc.name}
                        </span>
                        {acc.institutionName && (
                          <span className="text-[7px] font-bold text-rose-400 uppercase truncate block">
                            {acc.institutionName.slice(0, 10)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-rose-600 dark:text-rose-400">
                        -{formatCurrency(Math.abs(acc.balance))}
                      </div>
                      <span className="text-[7px] font-bold text-slate-400 font-mono">
                        {share.toFixed(0)}% debt
                      </span>
                    </div>
                  </div>
                );
              })}

              {liabilityAccounts.length === 0 && (
                <div className="text-center py-5 space-y-1">
                  <div className="flex items-center justify-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> 100% Debt-Free!
                  </div>
                  <p className="text-[8px] text-slate-400">
                    Zero liabilities • All assets are unencumbered equity
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Footer Info */}
        <div className="flex items-center justify-between text-[8px] text-slate-400 px-1 pt-0.5">
          <span>{activeAccounts.length} contributing accounts</span>
          <span className="font-mono font-bold text-slate-500">
            Balanced Equation
          </span>
        </div>
      </div>
    </Modal>
  );
}
