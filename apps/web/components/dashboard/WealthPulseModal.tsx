"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeModal } from "@/store/slices/uiSlice";
import { batchSyncAccounts } from "@/store/slices/accountsSlice";
import { Sparkles, Landmark, ArrowRight, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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

  // Group liquid accounts (bank & cash only)
  const liquidAccounts = useMemo(
    () => activeAccounts.filter((a) => a.type === "bank" || a.type === "cash"),
    [activeAccounts],
  );

  // Local state for balances
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only initialize form fields once upon opening the modal
    if (isOpen && !prevIsOpenRef.current) {
      const initial: Record<string, number> = {};
      liquidAccounts.forEach((acc) => {
        initial[acc.id] = acc.balance;
      });
      setBalances(initial);
      setNote("");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, liquidAccounts]);

  // Live real-time calculations
  const { previewNetWorth, netDelta } = useMemo(() => {
    let oldAssets = 0;
    let oldLiabilities = 0;
    let newAssets = 0;
    let newLiabilities = 0;

    activeAccounts.forEach((acc) => {
      const oldBal = Number(acc.balance) || 0;
      const isLiquid = acc.type === "bank" || acc.type === "cash";
      const newBal =
        isLiquid && balances[acc.id] !== undefined
          ? Number(balances[acc.id])
          : oldBal;

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
      const noteToSave = note.trim();
      const itemsToSync = liquidAccounts.map((acc) => ({
        accountId: acc.id,
        balance:
          balances[acc.id] !== undefined
            ? Number(balances[acc.id])
            : Number(acc.balance) || 0,
      }));

      // Dispatch API batch sync with explicit user-provided note
      await dispatch(
        batchSyncAccounts({
          accounts: itemsToSync,
          note: noteToSave || undefined,
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
            <Landmark className="size-4" />
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
          {/* Quick delta chips for bank & cash */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => adjustBalance(acc.id, 5000)}
              className="rounded-lg font-bold"
            >
              +5k
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => adjustBalance(acc.id, 10000)}
              className="rounded-lg font-bold"
            >
              +10k
            </Button>
          </div>

          <div className="relative flex-1 sm:w-44">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 z-10">
              ₹
            </span>
            <Input
              type="text"
              name="amount"
              inputMode="decimal"
              pattern="[0-9]*"
              value={currentVal || ""}
              onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
              placeholder="0"
              className="pl-7 pr-3 py-2 text-right font-mono text-sm h-10 rounded-xl"
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
              Update liquid cash & bank balances • instant recalculation
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(closeModal("isWealthPulseOpen"))}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isSubmitting || liquidAccounts.length === 0}
              isLoading={isSubmitting}
              onClick={handleSave}
              className="flex-1 sm:flex-initial"
              rightIcon={
                !isSubmitting ? <ArrowRight className="size-3.5" /> : undefined
              }
            >
              Recalculate
            </Button>
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
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

        {/* Optional Note / Milestone */}
        {liquidAccounts.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-white/5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Check-in Note or Milestone (Optional)
            </label>
            <Input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Month-end check-in, salary credited"
              className="h-10 text-xs rounded-xl"
            />
          </div>
        )}

        {liquidAccounts.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No active bank or cash accounts found. Please add bank or cash
            accounts first from Settings / Accounts.
          </div>
        )}
      </div>
    </Modal>
  );
}
