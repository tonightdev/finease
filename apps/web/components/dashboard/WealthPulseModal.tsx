"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeModal } from "@/store/slices/uiSlice";
import {
  batchSyncAccounts,
  optimisticUpdateBalances,
} from "@/store/slices/accountsSlice";
import {
  Sparkles,
  TrendingUp,
  Landmark,
  CreditCard,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";

export function WealthPulseModal() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector(
    (state: RootState) => state.ui.modals.isWealthPulseOpen,
  );
  const allAccounts = useSelector((state: RootState) => state.accounts.items);

  const activeAccounts = useMemo(
    () => allAccounts.filter((a) => !a.isClosed && !a.excludeFromAnalytics),
    [allAccounts],
  );

  // Group accounts
  const liquidAccounts = useMemo(
    () => activeAccounts.filter((a) => a.type === "bank" || a.type === "cash"),
    [activeAccounts],
  );
  const investmentAccounts = useMemo(
    () =>
      activeAccounts.filter(
        (a) => a.type === "investment" || a.type === "asset",
      ),
    [activeAccounts],
  );
  const liabilityAccounts = useMemo(
    () => activeAccounts.filter((a) => a.type === "debt" || a.type === "card"),
    [activeAccounts],
  );

  // Local state for balances
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      activeAccounts.forEach((acc) => {
        initial[acc.id] = acc.balance;
      });
      setBalances(initial);
      setNote("");
    }
  }, [isOpen, activeAccounts]);

  // Live real-time calculations
  const { previewNetWorth, netDelta } = useMemo(() => {
    let oldAssets = 0;
    let oldLiabilities = 0;
    let newAssets = 0;
    let newLiabilities = 0;

    activeAccounts.forEach((acc) => {
      const oldBal = Number(acc.balance) || 0;
      const newBal = Number(
        balances[acc.id] !== undefined ? balances[acc.id] : oldBal,
      );

      if (acc.type === "debt" || acc.type === "card") {
        oldLiabilities += Math.abs(oldBal);
        newLiabilities += Math.abs(newBal);
      } else {
        oldAssets += Math.max(0, oldBal);
        newAssets += Math.max(0, newBal);
      }
    });

    const oldNW = oldAssets - oldLiabilities;
    const newNW = newAssets - newLiabilities;
    return {
      previewNetWorth: newNW,
      netDelta: newNW - oldNW,
    };
  }, [activeAccounts, balances]);

  if (!isOpen) return null;

  const handleBalanceChange = (accountId: string, value: string) => {
    const num = parseFloat(value);
    setBalances((prev) => ({
      ...prev,
      [accountId]: isNaN(num) ? 0 : num,
    }));
  };

  const adjustBalance = (accountId: string, delta: number) => {
    setBalances((prev) => {
      const current = prev[accountId] ?? 0;
      return {
        ...prev,
        [accountId]: Math.max(0, current + delta),
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const itemsToSync = Object.entries(balances).map(
        ([accountId, balance]) => ({
          accountId,
          balance,
        }),
      );

      // 1. Optimistic instant update (<50ms feedback)
      dispatch(optimisticUpdateBalances(itemsToSync));

      // 2. Dispatch API batch sync
      await dispatch(
        batchSyncAccounts({
          accounts: itemsToSync,
          note: note.trim() || undefined,
        }),
      ).unwrap();

      toast.success(
        `✨ Wealth Pulse synced! Net Worth: ${formatCurrency(previewNetWorth)}`,
        { icon: "🚀", duration: 4000 },
      );

      dispatch(closeModal("isWealthPulseOpen"));
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sync balances";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountRow = (acc: Account, iconColor: string) => {
    const currentVal = balances[acc.id] ?? acc.balance;
    const isChanged = Math.abs(currentVal - acc.balance) > 0.01;

    return (
      <div
        key={acc.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 gap-3 transition-all hover:border-slate-300 dark:hover:border-white/10"
      >
        <div className="flex items-center gap-3">
          <div
            className={`size-9 rounded-xl flex items-center justify-center font-black ${iconColor}`}
          >
            {acc.type === "investment" ? (
              <TrendingUp className="size-4" />
            ) : acc.type === "debt" || acc.type === "card" ? (
              <CreditCard className="size-4" />
            ) : (
              <Landmark className="size-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {acc.name}
              </span>
              {isChanged && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Updated
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Last saved: {formatCurrency(acc.balance)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick delta chips for investments/bank */}
          {acc.type !== "debt" && acc.type !== "card" && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustBalance(acc.id, 5000)}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                +5k
              </button>
              <button
                type="button"
                onClick={() => adjustBalance(acc.id, 10000)}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                +10k
              </button>
            </div>
          )}

          <div className="relative flex-1 sm:w-44">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              value={currentVal || ""}
              onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 text-right font-mono text-sm font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal("isWealthPulseOpen"))}
      maxWidth="max-w-2xl"
      bodyClassName="p-0 overflow-hidden flex flex-col flex-1"
      title={
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Monthly Wealth Pulse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update balances in 60 seconds • instant growth recalculation
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span className="hidden sm:inline">100% Encrypted & Safe</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => dispatch(closeModal("isWealthPulseOpen"))}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || activeAccounts.length === 0}
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? (
                "Syncing..."
              ) : (
                <>
                  <span>Confirm & Recalculate</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      {/* Real-time Growth Ticker Banner */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-emerald-500/10 border-b border-primary/10 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Live Projected Net Worth
          </span>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatCurrency(previewNetWorth)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Delta
          </span>
          <div
            className={`text-sm sm:text-base font-black flex items-center justify-end gap-1 ${
              netDelta >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netDelta >= 0 ? "+" : ""}
            {formatCurrency(netDelta)}
          </div>
        </div>
      </div>

      {/* Account Lists (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {/* Liquid Accounts */}
        {liquidAccounts.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <Landmark className="size-3.5 text-blue-500" />
              <span>Liquid Cash & Bank Accounts</span>
            </div>
            <div className="space-y-2">
              {liquidAccounts.map((acc) =>
                renderAccountRow(
                  acc,
                  "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                ),
              )}
            </div>
          </div>
        )}

        {/* Investment Accounts */}
        {investmentAccounts.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>Growth, Investments & Assets</span>
            </div>
            <div className="space-y-2">
              {investmentAccounts.map((acc) =>
                renderAccountRow(
                  acc,
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                ),
              )}
            </div>
          </div>
        )}

        {/* Liabilities */}
        {liabilityAccounts.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
              <CreditCard className="size-3.5 text-rose-500" />
              <span>Liabilities, Cards & Loans</span>
            </div>
            <div className="space-y-2">
              {liabilityAccounts.map((acc) =>
                renderAccountRow(
                  acc,
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                ),
              )}
            </div>
          </div>
        )}

        {/* Optional Note / Milestone */}
        {activeAccounts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Check-in Note or Milestone (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. October month-end check-in, salary & bonus credited"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-[11px] placeholder:font-normal placeholder:text-slate-400/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        )}

        {activeAccounts.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No active accounts found. Please add accounts first from the
            Accounts view.
          </div>
        )}
      </div>
    </Modal>
  );
}
