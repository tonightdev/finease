"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  FileText,
  Activity,
  Trash2,
  CheckCircle2,
  Loader2,
  Zap,
  Pencil,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Expiry } from "@repo/types";
import {
  deleteExpiryAction,
  createExpiryAction,
  fetchArchivedExpiries,
} from "@/store/slices/expiriesSlice";
import { PlanningStatusFilter } from "@/components/planning/PlanningStatusFilter";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";

interface ExpiryCountdownProps {
  expiries: Expiry[];
  onEdit?: (expiry: Expiry) => void;
}

export function ExpiryCountdown({ expiries, onEdit }: ExpiryCountdownProps) {
  const [expiryToDelete, setExpiryToDelete] = useState<Expiry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [completedExpiry, setCompletedExpiry] = useState<Expiry | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [viewArchive, setViewArchive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const archivedExpiries = useSelector(
    (state: RootState) => state.expiries.archivedItems,
  );

  useEffect(() => {
    if (viewArchive) {
      dispatch(fetchArchivedExpiries());
    }
  }, [viewArchive, dispatch]);

  const handleComplete = (expiry: Expiry) => {
    setCompletedExpiry(expiry);
    const nextYear = new Date(expiry.expiryDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRenewalDate(nextYear.toISOString().split("T")[0] || "");
    setIsRenewModalOpen(true);
  };

  const confirmCompletion = async () => {
    if (!completedExpiry) return;

    setIsProcessing(true);
    try {
      await dispatch(deleteExpiryAction({ id: completedExpiry.id })).unwrap();
      toast.success("Expiry successfully completed.");
      setIsRenewModalOpen(false);
      setCompletedExpiry(null);
    } catch {
      toast.error("Failed to complete expiry");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmRenewal = async () => {
    if (!completedExpiry || !renewalDate) return;

    setIsProcessing(true);
    try {
      await dispatch(
        createExpiryAction({
          name: completedExpiry.name,
          type: completedExpiry.type,
          expiryDate: new Date(renewalDate).toISOString(),
          renewalAmount: completedExpiry.renewalAmount,
          metadata: completedExpiry.metadata || {},
        }),
      ).unwrap();

      await dispatch(deleteExpiryAction({ id: completedExpiry.id })).unwrap();

      toast.success("Expiry successfully renewed for next operational cycle.");
      setIsRenewModalOpen(false);
      setCompletedExpiry(null);
    } catch {
      toast.error("Failed to sync renewal expiry.");
    } finally {
      setIsProcessing(false);
    }
  };

  const sortedExpiries = useMemo(() => {
    const list = viewArchive ? archivedExpiries : expiries;
    return [...list].sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
  }, [expiries, archivedExpiries, viewArchive]);

  return (
    <div className="space-y-4">
      <PlanningStatusFilter
        activeStatus={viewArchive ? "archived" : "active"}
        onChange={(val) => setViewArchive(val === "archived")}
        options={[
          { value: "active", label: "Active Expiries" },
          { value: "archived", label: "Historical Logs" },
        ]}
      />

      {sortedExpiries.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-900/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {viewArchive
              ? "No archived expiries found"
              : "No active expiries configured"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {sortedExpiries.map((expiry) => (
              <CountdownCard
                key={expiry.id}
                expiry={expiry}
                isArchived={viewArchive}
                onEdit={(expiry) => !viewArchive && onEdit?.(expiry)}
                onComplete={() => handleComplete(expiry)}
                onDelete={() => {
                  setExpiryToDelete(expiry);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setExpiryToDelete(null);
        }}
        onConfirm={async () => {
          if (!expiryToDelete) return;
          setIsProcessing(true);
          try {
            await dispatch(
              deleteExpiryAction({ id: expiryToDelete.id, purge: viewArchive }),
            ).unwrap();
            toast.success(
              viewArchive
                ? "Expiry purged from logs."
                : "Expiry decommissioned.",
            );
            setIsDeleteModalOpen(false);
            setExpiryToDelete(null);
          } catch {
            toast.error("Failed to remove expiry.");
          } finally {
            setIsProcessing(false);
          }
        }}
        isDestructive={true}
        title={viewArchive ? "Purge Historical Log" : "Remove Expiry"}
        message={
          viewArchive
            ? "Permanently sanitize this historical record from the ledger? This action cannot be undone."
            : "Decommissioning this expiry node will stop active monitoring. This operation is recorded."
        }
        confirmText={viewArchive ? "Purge Record" : "Confirm Removal"}
      />

      <Modal
        isOpen={isRenewModalOpen && Boolean(completedExpiry)}
        onClose={() => {
          setIsRenewModalOpen(false);
          setCompletedExpiry(null);
        }}
        title="Expiry Completed"
        maxWidth="max-w-sm"
      >
        <div className="space-y-6 text-center">
          <div className="size-16 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Expiry Completed
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Authorize a renewal for the next operational cycle?
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/10 space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Next Expiry Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRenewalDate(e.target.value)
                  }
                  className="w-full h-10 px-3 pl-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white appearance-none"
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={confirmRenewal}
                disabled={isProcessing}
                className="w-full h-11 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Authorize Renewal"
                )}
              </button>
              <button
                type="button"
                onClick={confirmCompletion}
                disabled={isProcessing}
                className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Archive Only"
                )}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsRenewModalOpen(false);
              setCompletedExpiry(null);
            }}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors cursor-pointer"
          >
            Cancel Operation
          </button>
        </div>
      </Modal>
    </div>
  );
}

function CountdownCard({
  expiry,
  isArchived = false,
  onEdit,
  onComplete,
  onDelete,
}: {
  expiry: Expiry;
  isArchived?: boolean;
  onEdit?: (expiry: Expiry) => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>(() => {
    const diff = new Date(expiry.expiryDate).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
    };
  });

  useEffect(() => {
    if (isArchived) return;

    const calculate = () => {
      const diff = new Date(expiry.expiryDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    };

    calculate();
    const timer = setInterval(calculate, 60000);
    return () => clearInterval(timer);
  }, [expiry.expiryDate, isArchived]);

  const isPast = new Date(expiry.expiryDate).getTime() <= Date.now();
  const isExpired = !isArchived && isPast;
  const isCritical = !isArchived && (timeLeft.days < 7 || isExpired);

  const Icon =
    expiry.type === "policy"
      ? ShieldAlert
      : expiry.type === "document"
        ? FileText
        : Activity;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      exit={{ opacity: 0, scale: 0.98 }}
      onClick={() => {
        if (!isArchived && onEdit) {
          onEdit(expiry);
        }
      }}
      className={`group relative p-3 rounded-2xl border transition-all duration-300 h-full flex flex-col justify-between shadow-xs hover:shadow-md ${
        !isArchived ? "cursor-pointer" : "opacity-75 grayscale-[0.3]"
      } ${
        isCritical
          ? "bg-rose-50/20 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20 hover:border-rose-300"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-primary/30"
      }`}
    >
      {/* Top Details */}
      <div className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1">
            <h4
              className={`text-xs font-black tracking-tight uppercase leading-snug break-words ${
                isCritical
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              }`}
              title={expiry.name}
            >
              {expiry.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <Icon
                  className={`size-3 shrink-0 ${isCritical ? "text-rose-500" : "text-primary"}`}
                />
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  {isArchived
                    ? "Archived"
                    : `Due ${new Date(expiry.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`}
                </p>
              </div>
              <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                {expiry.type}
              </span>
            </div>
          </div>

          {!isArchived && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span
                className={`text-[8px] font-black font-mono tracking-tighter px-1.5 py-0.5 rounded-md border ${
                  isExpired
                    ? "bg-rose-500 text-white border-rose-500 shadow-xs"
                    : isCritical
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5"
                }`}
              >
                {isExpired ? "EXPIRED" : `${timeLeft.days}D ${timeLeft.hours}H`}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="size-7 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-lg transition-all active:scale-90 cursor-pointer"
                title="Complete & Log Renewal"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Allocation & Actions */}
      <div className="mt-auto pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-1.5">
        <div className="flex flex-col min-w-0">
          <span className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.1em] opacity-70">
            Renewal Cost
          </span>
          <span
            className={`text-xs font-black tracking-tight ${
              isCritical ? "text-rose-500" : "text-slate-900 dark:text-white"
            }`}
          >
            {expiry.renewalAmount > 0
              ? `₹${expiry.renewalAmount.toLocaleString("en-IN")}`
              : "No Cost"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isArchived && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(expiry);
              }}
              className="size-7 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-white/5 transition-all active:scale-90 cursor-pointer"
              title="Edit Expiry"
            >
              <Pencil className="size-3" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={`size-7 flex items-center justify-center border transition-all active:scale-90 rounded-lg cursor-pointer ${
              isArchived
                ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-500/10 hover:bg-rose-500 hover:text-white"
            }`}
            title={isArchived ? "Purge" : "Archive"}
          >
            {isArchived ? (
              <Zap className="size-3" />
            ) : (
              <Trash2 className="size-3" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
