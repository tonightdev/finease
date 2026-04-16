"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, FileText, Activity, Trash2, CheckCircle2, Loader2, Zap } from "lucide-react";
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
    <div className="space-y-4 py-2 px-1">
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
                onClick={() => !viewArchive && onEdit?.(expiry)}
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
  onClick,
  onComplete,
  onDelete,
}: {
  expiry: Expiry;
  isArchived?: boolean;
  onClick?: () => void;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={`group relative p-2.5 sm:p-3.5 rounded-xl border transition-all h-full flex flex-col justify-between ${!isArchived ? "cursor-pointer hover:border-primary/50" : "opacity-75 grayscale-[0.5]"
        } ${isCritical
          ? "bg-rose-50/20 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 shadow-sm"
          : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 shadow-sm"
        }`}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div
            className={`p-1 rounded-lg border ${isCritical ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20" : "bg-indigo-50 dark:bg-indigo-500/10 text-primary border-indigo-100 dark:border-indigo-500/20"}`}
          >
            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span
            className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${isArchived
              ? "text-slate-500 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
              : isExpired
                ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
                : isCritical
                  ? "text-orange-600 bg-orange-500/10 border-orange-500/20"
                  : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
              }`}
          >
            {isArchived ? "Archived" : isExpired ? "Expired" : isCritical ? "Urgent" : "Active"}
          </span>
        </div>

        <div className="min-w-0">
          <h4
            className={`text-xs sm:text-sm font-black truncate tracking-tight ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
          >
            {expiry.name}
          </h4>
          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed mt-0.5">
            {isArchived
              ? `Completed ${expiry.deletedAt ? new Date(expiry.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'N/A'}`
              : isExpired ? "EXPIRED" : `${timeLeft.days}D ${timeLeft.hours}H LEFT`}
          </p>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-50 dark:border-white/5">
          <div className="flex flex-col min-w-0">
            <span className="text-[6px] sm:text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none truncate">
              Nexus Cost
            </span>
            <span className={`text-[9px] sm:text-[10px] font-black truncate ${isCritical ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
              ₹{expiry.renewalAmount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isArchived && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="p-1 px-2 text-slate-300 hover:text-emerald-500 transition-colors"
                title="Complete Expiry"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className={`p-1 px-2 transition-colors ${isArchived ? "text-rose-500 hover:bg-rose-500/10 rounded-lg" : "text-slate-300 hover:text-rose-500 group-hover:text-rose-500"}`}
              title={isArchived ? "Purge Log" : "Archive Expiry"}
            >
              {isArchived ? <Zap className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
