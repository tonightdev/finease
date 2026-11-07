"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeModal } from "@/store/slices/uiSlice";
import { batchSyncAccounts } from "@/store/slices/accountsSlice";
import {
  Sparkles,
  Landmark,
  Wallet,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { haptics } from "@/lib/haptics";

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

  // Local state for balances (string | number to support fluid typing)
  const [balances, setBalances] = useState<Record<string, string | number>>({});
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only initialize form fields once upon opening the modal
    if (isOpen && !prevIsOpenRef.current) {
      const initial: Record<string, string | number> = {};
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
          ? Number(balances[acc.id]) || 0
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
    // Keep only digits and decimal point for clean, safe numeric inputs
    const clean = value.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    const sanitized =
      parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : clean;

    setBalances((prev) => ({
      ...prev,
      [accountId]: sanitized,
    }));
  };

  const handleResetAccount = (accountId: string, originalBalance: number) => {
    haptics.tick();
    setBalances((prev) => ({
      ...prev,
      [accountId]: originalBalance,
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const noteToSave = note.trim();
      const itemsToSync = liquidAccounts.map((acc) => ({
        accountId: acc.id,
        balance:
          balances[acc.id] !== undefined
            ? Number(balances[acc.id]) || 0
            : Number(acc.balance) || 0,
      }));

      // Dispatch API batch sync with explicit user-provided note
      await dispatch(
        batchSyncAccounts({
          accounts: itemsToSync,
          note: noteToSave || undefined,
        }),
      ).unwrap();

      haptics.success();
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

  const renderAccountCard = (acc: Account) => {
    const rawVal =
      balances[acc.id] !== undefined ? balances[acc.id] : acc.balance;
    const numVal = Number(rawVal) || 0;
    const isChanged = Math.abs(numVal - acc.balance) > 0.01;
    const isCash = acc.type === "cash";

    return (
      <div
        key={acc.id}
        className={cn(
          "relative p-2 rounded-xl transition-all border flex flex-col justify-between gap-1.5",
          liquidAccounts.length === 1 && "col-span-2",
          isChanged
            ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border-emerald-500/40 dark:border-emerald-500/30"
            : "bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10",
        )}
      >
        {/* Top row: Icon + Name + Prev balance + Reset */}
        <div className="flex items-center justify-between gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div
              className={cn(
                "size-5 rounded flex items-center justify-center shrink-0",
                isCash
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              )}
            >
              {isCash ? (
                <Wallet className="size-3" />
              ) : (
                <Landmark className="size-3" />
              )}
            </div>
            <span
              className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white truncate leading-none"
              title={acc.name}
            >
              {acc.name}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span
              className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-none"
              title={`Previous: ${formatCurrency(acc.balance)}`}
            >
              {formatCurrency(acc.balance)}
            </span>
            {isChanged && (
              <button
                type="button"
                onClick={() => handleResetAccount(acc.id, acc.balance)}
                title="Reset to saved balance"
                className="p-0.5 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
              >
                <RotateCcw className="size-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: Compact Full-Width Numeric Input */}
        <div className="relative flex items-center">
          <span className="absolute left-2 text-[10px] sm:text-[11px] font-bold text-slate-400 pointer-events-none select-none z-10">
            ₹
          </span>
          <input
            type="text"
            name="amount"
            inputMode="decimal"
            pattern="[0-9]*"
            value={rawVal === "" ? "" : rawVal}
            onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
            placeholder="0"
            className="w-full h-7 pl-4.5 pr-2 text-right font-mono text-[11px] sm:text-xs font-bold rounded-lg bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal("isWealthPulseOpen"))}
      maxWidth="max-w-lg sm:max-w-xl"
      bodyClassName="p-0 overflow-hidden flex flex-col flex-1"
      footerClassName="!p-2.5 sm:!py-3 sm:!px-4 !pb-2.5 sm:!pb-3"
      title={
        <div className="flex items-center gap-2">
          <div className="size-6 sm:size-7 rounded-lg bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="size-3 sm:size-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
              Monthly Wealth Pulse
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 truncate leading-tight">
              Update liquid cash & bank balances • instant recalculation
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400">
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
            <span className="hidden xs:inline">100% Encrypted & Safe</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(closeModal("isWealthPulseOpen"))}
              className="h-7 sm:h-8 text-[11px] sm:text-xs font-bold px-2.5"
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
              className="h-7 sm:h-8 text-[11px] sm:text-xs font-bold px-3.5"
              rightIcon={
                !isSubmitting ? <ArrowRight className="size-3" /> : undefined
              }
            >
              Recalculate
            </Button>
          </div>
        </div>
      }
    >
      {/* Real-time Growth Ticker Strip */}
      <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-emerald-500/10 border-b border-primary/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Net Worth:
          </span>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono tracking-tight truncate">
            {formatCurrency(previewNetWorth)}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 hidden xs:inline">
            Delta:
          </span>
          <div
            className={cn(
              "text-[10px] sm:text-xs font-bold font-mono flex items-center gap-0.5 px-1.5 py-0.5 rounded",
              netDelta > 0
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : netDelta < 0
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  : "bg-slate-500/10 text-slate-400",
            )}
          >
            {netDelta > 0 ? (
              <TrendingUp className="size-2.5 sm:size-3 shrink-0" />
            ) : netDelta < 0 ? (
              <TrendingDown className="size-2.5 sm:size-3 shrink-0" />
            ) : null}
            <span>
              {netDelta > 0 ? "+" : ""}
              {formatCurrency(netDelta)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Lists */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2">
        {/* Liquid Accounts */}
        {liquidAccounts.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
              <div className="flex items-center gap-1">
                <Landmark className="size-3 text-blue-500" />
                <span>Liquid Accounts ({liquidAccounts.length})</span>
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 normal-case font-medium">
                Tap to edit
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {liquidAccounts.map((acc) => renderAccountCard(acc))}
            </div>
          </div>
        )}

        {/* Optional Note / Milestone */}
        {liquidAccounts.length > 0 && (
          <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100 dark:border-white/5">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
              Note:
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Salary credited, monthly sync (optional)..."
              className="flex-1 h-7 text-[11px] sm:text-xs px-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:text-[10px] sm:placeholder:text-xs focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}

        {liquidAccounts.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-xs">
            No active bank or cash accounts found. Please add accounts from
            Settings.
          </div>
        )}
      </div>
    </Modal>
  );
}
