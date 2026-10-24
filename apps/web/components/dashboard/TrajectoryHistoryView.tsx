"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchSnapshots,
  deleteSnapshotAction,
} from "@/store/slices/accountsSlice";
import { openModal } from "@/store/slices/uiSlice";
import {
  History,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Landmark,
  CreditCard,
  Trash2,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { WealthSnapshot, AccountSnapshotItem } from "@repo/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditSnapshotModal } from "./EditSnapshotModal";

export function TrajectoryHistoryView() {
  const dispatch = useDispatch<AppDispatch>();
  const snapshots = useSelector(
    (state: RootState) => state.accounts.snapshots || [],
  );

  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(
    null,
  );
  const [snapshotToDelete, setSnapshotToDelete] = useState<{
    id: string;
    dateStr: string;
  } | null>(null);
  const [snapshotToEdit, setSnapshotToEdit] = useState<WealthSnapshot | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchSnapshots(50));
  }, [dispatch]);

  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime(),
    );
  }, [snapshots]);

  const { totalPulses, netGainSinceFirst, latestNetWorth } = useMemo(() => {
    if (sortedSnapshots.length === 0) {
      return { totalPulses: 0, netGainSinceFirst: 0, latestNetWorth: 0 };
    }
    const latest = sortedSnapshots[0]?.netWorth || 0;
    const earliest = sortedSnapshots[sortedSnapshots.length - 1]?.netWorth || 0;
    return {
      totalPulses: sortedSnapshots.length,
      netGainSinceFirst: latest - earliest,
      latestNetWorth: latest,
    };
  }, [sortedSnapshots]);

  const toggleExpand = (id: string) => {
    setExpandedSnapshotId((prev) => (prev === id ? null : id));
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "investment":
      case "asset":
        return <TrendingUp className="size-3.5 text-emerald-500" />;
      case "debt":
      case "card":
        return <CreditCard className="size-3.5 text-rose-500" />;
      default:
        return <Landmark className="size-3.5 text-blue-500" />;
    }
  };

  const isMasked = formatCurrency(latestNetWorth) === "*****";
  const isGainPositive = netGainSinceFirst >= 0;

  return (
    <div className="space-y-4">
      {/* Executive Growth Log Header Card */}
      <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-white via-slate-50 to-indigo-50/20 dark:from-[#0d1117] dark:via-[#090b0e] dark:to-indigo-950/20 border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        {/* Top Header Row: Title, Pulses Badge & Take Pulse CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 sm:size-11 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <History className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Growth Log & Trajectory
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {totalPulses} {totalPulses === 1 ? "Pulse" : "Pulses"}{" "}
                  Recorded
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Periodic net worth checkpoints & historical progression audit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch(openModal("isWealthPulseOpen"))}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-primary/25 transition-all active:scale-95 shrink-0"
          >
            <Sparkles className="size-3.5 text-amber-300" />
            <span>Take 60s Pulse</span>
          </button>
        </div>

        {/* 2 Clean Stat Metrics Cards */}
        {sortedSnapshots.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 dark:border-white/5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Current Net Worth
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(latestNetWorth)}
                </div>
              </div>
              <div className="size-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                <Landmark className="size-4" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                  Total Wealth Trajectory Gain
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                      isGainPositive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                    }`}
                  >
                    {isMasked ? (
                      "*****"
                    ) : (
                      <>
                        {isGainPositive ? "+" : ""}
                        {formatCurrency(netGainSinceFirst)}
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden xs:inline">
                    Since first pulse
                  </span>
                </div>
              </div>
              <div
                className={`size-8 rounded-xl flex items-center justify-center ${
                  isGainPositive
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                }`}
              >
                {isGainPositive ? (
                  <TrendingUp className="size-4" />
                ) : (
                  <TrendingDown className="size-4" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Snapshots Log List */}
      <div className="space-y-3">
        {sortedSnapshots.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200/70 dark:border-white/5 shadow-sm space-y-3">
            <div className="size-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-6 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Trajectory Records Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Once you complete your first Wealth Pulse, every update and
                account increment/decrement will be securely logged here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(openModal("isWealthPulseOpen"))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-wider shadow-md shadow-primary/25 active:scale-95 transition-all"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Record First Pulse</span>
            </button>
          </div>
        ) : (
          sortedSnapshots.map((item: WealthSnapshot) => {
            const isExpanded = expandedSnapshotId === item.id;
            const delta = item.netWorthDelta ?? 0;
            const isPositive = delta >= 0;
            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : item.date;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                {/* Row Header */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-3.5 sm:p-4 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-10 sm:size-11 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                        isPositive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="size-5" />
                      ) : (
                        <TrendingDown className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(item.netWorth)}
                        </span>
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center justify-center ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            }`}
                          >
                            {formatCurrency(delta) === "*****"
                              ? "*****"
                              : `${isPositive ? "+" : ""}${formatCurrency(delta)}`}
                          </span>
                        )}
                      </div>
                      {/* Hidden on mobile, shown on desktop */}
                      <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mt-1 truncate">
                        <Calendar className="size-3 shrink-0" />
                        <span className="truncate">{formattedDate}</span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600 dark:text-slate-300 font-medium truncate">
                              &ldquo;{item.note}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-xl">
                      {item.accountSnapshots?.length || 0} accounts
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSnapshotToEdit(item);
                      }}
                      className="size-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Edit this Wealth Pulse entry"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSnapshotToDelete({
                          id: item.id,
                          dateStr: formattedDate,
                        });
                      }}
                      className="size-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete this Wealth Pulse entry"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="size-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Breakdown */}
                {isExpanded && item.accountSnapshots && (
                  <div className="p-3.5 sm:p-5 pt-0 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                    {/* Date, Time & Note details header (prominent on mobile) */}
                    <div className="pt-3 pb-1 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Calendar className="size-3.5 text-primary" />
                          <span>
                            {new Date(
                              item.createdAt || item.date,
                            ).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.accountSnapshots.length} Accounts
                        </span>
                      </div>
                      {item.note && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 italic bg-white dark:bg-white/5 px-3 py-2 rounded-xl border border-slate-200/60 dark:border-white/5">
                          &ldquo;{item.note}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-1 flex items-center justify-between">
                      <span>Account Balances & Delta in this Pulse</span>
                      <span className="font-mono text-[9px] text-slate-500">
                        {item.accountSnapshots.length} Nodes
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {item.accountSnapshots.map((acc: AccountSnapshotItem) => {
                        const accDelta = acc.delta ?? 0;
                        const accPositive = accDelta > 0;
                        const accNegative = accDelta < 0;

                        return (
                          <div
                            key={acc.accountId}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 text-xs shadow-sm hover:border-primary/20 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                {getAccountIcon(acc.type)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                                  {acc.accountName}
                                </span>
                                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                                  {acc.type}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0 ml-3">
                              <div className="font-mono font-bold text-slate-900 dark:text-white">
                                {formatCurrency(acc.balance)}
                              </div>
                              {/* Delta Pill */}
                              {accPositive ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatCurrency(accDelta) === "*****"
                                    ? "*****"
                                    : `+${formatCurrency(accDelta)}`}
                                </span>
                              ) : accNegative ? (
                                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                                  {formatCurrency(accDelta)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400">
                                  No change
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirm Delete Wealth Pulse Modal */}
      <ConfirmModal
        isOpen={!!snapshotToDelete}
        title="Delete Wealth Pulse"
        message={`Are you sure you want to permanently delete the Wealth Pulse entry from ${snapshotToDelete?.dateStr}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          if (snapshotToDelete) {
            await dispatch(deleteSnapshotAction(snapshotToDelete.id)).unwrap();
            toast.success("Wealth Pulse entry deleted");
            setSnapshotToDelete(null);
          }
        }}
        onCancel={() => setSnapshotToDelete(null)}
      />

      {/* Edit Wealth Pulse Modal */}
      <EditSnapshotModal
        isOpen={!!snapshotToEdit}
        snapshot={snapshotToEdit}
        onClose={() => setSnapshotToEdit(null)}
      />
    </div>
  );
}
