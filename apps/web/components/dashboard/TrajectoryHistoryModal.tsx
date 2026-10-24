"use client";

import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeModal, openModal } from "@/store/slices/uiSlice";
import {
  fetchSnapshots,
  deleteSnapshotAction,
} from "@/store/slices/accountsSlice";
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
  ShieldCheck,
  Trash2,
  Pencil,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { WealthSnapshot, AccountSnapshotItem } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditSnapshotModal } from "./EditSnapshotModal";

export function TrajectoryHistoryModal() {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector(
    (state: RootState) => state.ui.modals.isTrajectoryHistoryOpen,
  );
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
    if (isOpen) {
      dispatch(fetchSnapshots(30));
    }
  }, [isOpen, dispatch]);

  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime(),
    );
  }, [snapshots]);

  // Overall trajectory stats
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

  if (!isOpen) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal("isTrajectoryHistoryOpen"))}
      maxWidth="max-w-2xl"
      bodyClassName="p-0 overflow-hidden flex flex-col flex-1"
      title={
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <History className="size-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Wealth Trajectory & Pulse History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed timeline of periodic check-ins, increments & decrements
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>Immutable Wealth History Log</span>
          </div>
          <button
            onClick={() => dispatch(closeModal("isTrajectoryHistoryOpen"))}
            className="px-5 py-2 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      {/* Quick Stats Summary Banner */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/5 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 p-4 text-center shrink-0">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Check-ins
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            {totalPulses}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Current Net Worth
          </span>
          <div className="text-base sm:text-lg font-black text-primary">
            {formatCurrency(latestNetWorth)}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Trajectory Gain
          </span>
          <div
            className={`text-base sm:text-lg font-black ${
              netGainSinceFirst >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netGainSinceFirst >= 0 ? "+" : ""}
            {formatCurrency(netGainSinceFirst)}
          </div>
        </div>
      </div>

      {/* Snapshots Timeline (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {sortedSnapshots.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="size-14 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="size-7 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No Trajectory Records Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Take your first 60-second Wealth Pulse to start recording your
                wealth progress and account increments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                dispatch(closeModal("isTrajectoryHistoryOpen"));
                dispatch(openModal("isWealthPulseOpen"));
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/25"
            >
              <Sparkles className="size-3.5 text-amber-300" />
              <span>Take First Wealth Pulse</span>
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
                className="rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden transition-all hover:border-slate-300 dark:hover:border-white/20"
              >
                {/* Snapshot Header Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 cursor-pointer flex items-center justify-between gap-3 select-none hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-xl flex items-center justify-center font-black ${
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
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.netWorth)}
                        </span>
                        {/* Increment / Decrement Badge */}
                        {delta !== 0 && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center justify-center ${
                              isPositive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                            }`}
                          >
                            {isPositive && formatCurrency(delta) !== "*****"
                              ? "+"
                              : ""}
                            {formatCurrency(delta)}
                          </span>
                        )}
                      </div>
                      {/* Hidden on mobile, shown on desktop */}
                      <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                        <Calendar className="size-3 shrink-0" />
                        <span className="truncate">{formattedDate}</span>
                        {item.note && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-500 dark:text-slate-400 truncate">
                              &ldquo;{item.note}&rdquo;
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {item.accountSnapshots?.length || 0} accounts
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSnapshotToEdit(item);
                      }}
                      className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
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
                      className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete this Wealth Pulse entry"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <div className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expandable Account Breakdown */}
                {isExpanded && item.accountSnapshots && (
                  <div className="p-3.5 sm:p-4 pt-0 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] space-y-2.5">
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

                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 pt-1 pb-0.5">
                      Account Increments & Decrements
                    </div>
                    <div className="space-y-1.5">
                      {item.accountSnapshots.map((acc: AccountSnapshotItem) => {
                        const accDelta = acc.delta ?? 0;
                        const accPositive = accDelta > 0;
                        const accNegative = accDelta < 0;

                        return (
                          <div
                            key={acc.accountId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              {getAccountIcon(acc.type)}
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {acc.accountName}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-slate-500 dark:text-slate-400">
                                {formatCurrency(acc.balance)}
                              </span>
                              {/* Increment / Decrement pill */}
                              {accPositive ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                  +{formatCurrency(accDelta)}
                                </span>
                              ) : accNegative ? (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                  {formatCurrency(accDelta)}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5">
                                  ±0
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
    </Modal>
  );
}
