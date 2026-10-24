"use client";

import { useState, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { updateSnapshotAction } from "@/store/slices/accountsSlice";
import { TrendingUp, Landmark, CreditCard, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { WealthSnapshot, AccountSnapshotItem } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface EditSnapshotModalProps {
  snapshot: WealthSnapshot | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditSnapshotModal({
  snapshot,
  isOpen,
  onClose,
}: EditSnapshotModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [balances, setBalances] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (snapshot && isOpen) {
      const initial: Record<string, number> = {};
      snapshot.accountSnapshots?.forEach((acc) => {
        initial[acc.accountId] = Number(acc.balance) || 0;
      });
      setBalances(initial);
      setNote(snapshot.note || "");
    }
  }, [snapshot, isOpen]);

  // Group accounts by asset classification
  const categorizedAccounts = useMemo(() => {
    const liquid: AccountSnapshotItem[] = [];
    const investments: AccountSnapshotItem[] = [];
    const liabilities: AccountSnapshotItem[] = [];

    (snapshot?.accountSnapshots || []).forEach((acc) => {
      if (acc.type === "debt" || acc.type === "card") {
        liabilities.push(acc);
      } else if (acc.type === "investment" || acc.type === "asset") {
        investments.push(acc);
      } else {
        liquid.push(acc);
      }
    });

    return { liquid, investments, liabilities };
  }, [snapshot]);

  // Real-time calculations as user tweaks balances
  const { previewNetWorth, previewDelta, totalAssets, totalLiabilities } =
    useMemo(() => {
      if (!snapshot || !snapshot.accountSnapshots) {
        return {
          previewNetWorth: 0,
          previewDelta: 0,
          totalAssets: 0,
          totalLiabilities: 0,
        };
      }

      let assets = 0;
      let liabilities = 0;

      snapshot.accountSnapshots.forEach((acc) => {
        const bal =
          balances[acc.accountId] !== undefined
            ? Number(balances[acc.accountId]) || 0
            : Number(acc.balance) || 0;

        if (acc.type === "debt" || acc.type === "card") {
          liabilities += Math.abs(bal);
        } else {
          assets += Math.max(0, bal);
        }
      });

      const netWorth = assets - liabilities;
      const prevNW = Number(snapshot.previousNetWorth ?? 0);
      const delta = netWorth - prevNW;

      return {
        previewNetWorth: netWorth,
        previewDelta: delta,
        totalAssets: assets,
        totalLiabilities: liabilities,
      };
    }, [snapshot, balances]);

  if (!isOpen || !snapshot) return null;

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
      await dispatch(
        updateSnapshotAction({
          id: snapshot.id,
          data: {
            note: note.trim(),
            accountBalances: balances,
          },
        }),
      ).unwrap();

      toast.success("Wealth Pulse entry updated");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update Wealth Pulse";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDate = new Date(
    snapshot.createdAt || snapshot.date,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isDeltaPositive = previewDelta >= 0;

  const renderAccountItem = (
    acc: AccountSnapshotItem,
    iconColor: string,
    isLiability = false,
  ) => {
    const currentVal = balances[acc.accountId] ?? acc.balance;
    const prevBal = acc.previousBalance ?? 0;
    const lineDelta = currentVal - prevBal;
    const isLinePositive = lineDelta > 0;
    const isChanged = Math.abs(currentVal - acc.balance) > 0.01;

    return (
      <div
        key={acc.accountId}
        className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 gap-2 sm:gap-3 transition-all hover:border-slate-300 dark:hover:border-white/10"
      >
        {/* Left: Account Icon and Details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`size-8 sm:size-9 rounded-xl flex items-center justify-center font-black shrink-0 ${iconColor}`}
          >
            {acc.type === "investment" || acc.type === "asset" ? (
              <TrendingUp className="size-3.5 sm:size-4" />
            ) : acc.type === "debt" || acc.type === "card" ? (
              <CreditCard className="size-3.5 sm:size-4" />
            ) : (
              <Landmark className="size-3.5 sm:size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {acc.accountName}
              </span>
              {isChanged && (
                <span className="text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  Updated
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 truncate">
              <span>Base: {formatCurrency(prevBal)}</span>
              {lineDelta !== 0 && (
                <span
                  className={`font-mono font-bold shrink-0 ${
                    isLinePositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  • {isLinePositive ? "+" : ""}
                  {formatCurrency(lineDelta)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Delta Chips & Input */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isLiability && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustBalance(acc.accountId, 5000)}
                className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-200/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                +5k
              </button>
            </div>
          )}

          <div className="relative w-24 sm:w-32">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
              ₹
            </span>
            <input
              type="number"
              value={currentVal || ""}
              onChange={(e) =>
                handleBalanceChange(acc.accountId, e.target.value)
              }
              placeholder="0"
              className="w-full pl-5 pr-2 py-1.5 text-right font-mono text-xs sm:text-sm font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Pencil className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Edit Wealth Pulse
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                {formattedDate}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Adjust checkpoint note or recorded account balances
            </p>
          </div>
        </div>
      }
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isSubmitting}
            className="px-6"
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5">
        {/* Recalculated Net Worth Executive Banner */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950/40 text-white border border-slate-700/50 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Recalculated Net Worth
            </span>
            {snapshot.previousNetWorth !== undefined && (
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center justify-center shrink-0 ${
                  isDeltaPositive
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                }`}
              >
                {isDeltaPositive && formatCurrency(previewDelta) !== "*****"
                  ? "+"
                  : ""}
                {formatCurrency(previewDelta)}
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
              {formatCurrency(previewNetWorth)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[10px]">
            <div className="flex-1 flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="text-slate-400">Assets</span>
              <span className="font-mono font-bold">
                {formatCurrency(totalAssets)}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-between px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <span className="text-slate-400">Liabilities</span>
              <span className="font-mono font-bold">
                {formatCurrency(totalLiabilities)}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Note / Milestone */}
        <div>
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

        {/* Categorized Accounts List */}
        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
          {/* Liquid Capital */}
          {categorizedAccounts.liquid.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <Landmark className="size-3.5 text-blue-500" />
                <span>Liquid Capital (Cash & Banks)</span>
              </div>
              <div className="space-y-2">
                {categorizedAccounts.liquid.map((acc) =>
                  renderAccountItem(
                    acc,
                    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  ),
                )}
              </div>
            </div>
          )}

          {/* Investments */}
          {categorizedAccounts.investments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <TrendingUp className="size-3.5 text-emerald-500" />
                <span>Investments & Growth Assets</span>
              </div>
              <div className="space-y-2">
                {categorizedAccounts.investments.map((acc) =>
                  renderAccountItem(
                    acc,
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  ),
                )}
              </div>
            </div>
          )}

          {/* Liabilities */}
          {categorizedAccounts.liabilities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                <CreditCard className="size-3.5 text-rose-500" />
                <span>Liabilities, Cards & Loans</span>
              </div>
              <div className="space-y-2">
                {categorizedAccounts.liabilities.map((acc) =>
                  renderAccountItem(
                    acc,
                    "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                    true,
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
