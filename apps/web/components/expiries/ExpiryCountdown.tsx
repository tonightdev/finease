"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, FileText, Activity, Trash2, CheckCircle2, Loader2, Zap, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Expiry } from "@repo/types";
import { deleteExpiryAction, createExpiryAction, fetchArchivedExpiries } from "@/store/slices/expiriesSlice";
import { PlanningStatusFilter } from "@/components/planning/PlanningStatusFilter";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import toast from "react-hot-toast";
import { DateInput } from "@/components/ui/DateInput";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ExpiryCountdownProps {
  expiries: Expiry[];
  onEdit?: (expiry: Expiry) => void;
}

export function ExpiryCountdown({
  expiries,
  onEdit,
}: ExpiryCountdownProps) {
  const [expiryToDelete, setExpiryToDelete] = useState<Expiry | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [completedExpiry, setCompletedExpiry] = useState<Expiry | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [viewArchive, setViewArchive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const archivedExpiries = useSelector((state: RootState) => state.expiries.archivedItems);

  useEffect(() => {
    if (viewArchive) {
      dispatch(fetchArchivedExpiries());
    }
  }, [viewArchive, dispatch]);

  const handleComplete = (expiry: Expiry) => {
    setCompletedExpiry(expiry);
    const nextYear = new Date(expiry.expiryDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRenewalDate(nextYear.toISOString().split('T')[0] || "");
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
      await dispatch(createExpiryAction({
        name: completedExpiry.name,
        type: completedExpiry.type,
        expiryDate: new Date(renewalDate).toISOString(),
        renewalAmount: completedExpiry.renewalAmount,
        metadata: completedExpiry.metadata || {}
      })).unwrap();

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
            {viewArchive ? "No archived expiries found" : "No active expiries configured"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            await dispatch(deleteExpiryAction({ id: expiryToDelete.id, purge: viewArchive })).unwrap();
            toast.success(viewArchive ? "Expiry purged from logs." : "Expiry decommissioned.");
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
        message={viewArchive
          ? "Permanently sanitize this historical record from the ledger? This action cannot be undone."
          : "Decommissioning this expiry node will stop active monitoring. This operation is recorded."}
        confirmText={viewArchive ? "Purge Record" : "Confirm Removal"}
      />

      <AnimatePresence>
        {isRenewModalOpen && completedExpiry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => {
                setIsRenewModalOpen(false);
                setCompletedExpiry(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-white/10 p-8 overflow-hidden"
            >
              <div className="relative space-y-6 text-center">
                <div className="size-16 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Expiry Completed</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Authorize a renewal for the next operational cycle?
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-xl border border-slate-100 dark:border-white/5 space-y-4">
                  <DateInput
                    label="Next Expiry Node"
                    value={renewalDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenewalDate(e.target.value)}
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={confirmRenewal}
                      disabled={isProcessing}
                      className="w-full h-11 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Authorize Renewal"}
                    </button>
                    <button
                      onClick={confirmCompletion}
                      disabled={isProcessing}
                      className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Archive Only"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsRenewModalOpen(false);
                    setCompletedExpiry(null);
                  }}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                >
                  Cancel Operation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
  }>({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    if (isArchived) return;

    const calculate = () => {
      const diff =
        new Date(expiry.expiryDate).getTime() - new Date().getTime();
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

  const isCritical = !isArchived && timeLeft.days < 7;
  const isExpired =
    !isArchived && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

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
      whileHover={{ y: -2, scale: 1.01 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`group relative p-3 rounded-2xl border transition-all duration-300 h-full flex flex-row gap-3 shadow-sm hover:shadow-lg ${!isArchived ? "cursor-pointer" : "opacity-75 grayscale-[0.3]"
        } ${isCritical
          ? "bg-rose-50/10 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20"
          : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5"
        }`}
    >
      {/* Left Column: Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <h4 className={`text-xs font-black truncate tracking-tight uppercase leading-none ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}>
                {expiry.name}
              </h4>
              <div className="flex items-center gap-1 mt-1.5">
                <Icon className={`size-3 shrink-0 ${isCritical ? "text-rose-500" : "text-primary"}`} />
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {isArchived ? "Archived" : `By ${new Date(expiry.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                </p>
              </div>
            </div>
          </div>

          {!isArchived && (
            <p className={`text-[10px] font-black font-mono tracking-tighter ${isCritical ? "text-rose-500" : "text-slate-600 dark:text-slate-400"}`}>
              {isExpired ? "TIME EXPIRED" : `${timeLeft.days}D ${timeLeft.hours}H LEFT`}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2 border-t border-slate-50 dark:border-white/5 flex flex-col gap-0.5">
          <span className="text-[6px] font-bold text-slate-400 uppercase tracking-[0.1em] opacity-70">
            Allocation
          </span>
          <span className={`text-[11px] font-black tracking-tight ${isCritical ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
            ₹{expiry.renewalAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Right Column: Tactical Actions */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 pl-3 border-l border-slate-100 dark:border-white/5">
        <div className={`mb-auto px-1.5 py-0.5 text-[6px] font-black rounded border shadow-sm text-center ${isArchived
          ? "text-slate-500 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
          : isExpired
            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
            : isCritical
              ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
          }`}>
          {isArchived ? "LOG" : isExpired ? "RENEW" : isCritical ? "!!! " : "Active"}
        </div>

        <div className="flex flex-col gap-1.5 mt-auto">
          {!isArchived && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                className="size-7 flex items-center justify-center bg-emerald-500/5 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/10 rounded-lg transition-all active:scale-90"
                title="Complete"
              >
                <CheckCircle2 className="size-3.5" />
              </button>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(expiry); }}
                  className="size-7 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-100 dark:border-white/5 transition-all active:scale-90"
                  title="Edit"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className={`size-7 flex items-center justify-center border transition-all active:scale-90 rounded-lg ${isArchived
              ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white"
              : "bg-rose-50 dark:bg-rose-500/5 text-rose-500 border-rose-500/5 hover:bg-rose-500 hover:text-white"}`}
            title={isArchived ? "Purge" : "Archive"}
          >
            {isArchived ? <Zap className="size-3.5" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
