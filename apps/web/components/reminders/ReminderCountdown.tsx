"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, FileText, Activity, Trash2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reminder, deleteReminder, createReminder, fetchArchivedReminders } from "@/store/slices/remindersSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import toast from "react-hot-toast";
import { DateInput } from "@/components/ui/DateInput";

interface ReminderCountdownProps {
  reminders: Reminder[];
  onEdit?: (reminder: Reminder) => void;
}

import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function ReminderCountdown({
  reminders,
  onEdit,
}: ReminderCountdownProps) {
  const [reminderToDelete, setReminderToDelete] = useState<Reminder | null>(
    null,
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [completedReminder, setCompletedReminder] = useState<Reminder | null>(null);
  const [renewalDate, setRenewalDate] = useState("");
  const [viewArchive, setViewArchive] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const archivedReminders = useSelector((state: RootState) => state.reminders.archivedItems);

  useEffect(() => {
    if (viewArchive) {
      dispatch(fetchArchivedReminders());
    }
  }, [viewArchive, dispatch]);

  const handleComplete = (reminder: Reminder) => {
    setCompletedReminder(reminder);
    const nextYear = new Date(reminder.expiryDate);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setRenewalDate(nextYear.toISOString().split('T')[0] || "");
    setIsRenewModalOpen(true);
  };

  const confirmCompletion = async () => {
    if (!completedReminder) return;
    
    // First delete the current one as it's completed
    await dispatch(deleteReminder(completedReminder.id)).unwrap();
    toast.success("Signal successfully completed.");
    setIsRenewModalOpen(false);
    setCompletedReminder(null);
  };

  const confirmRenewal = async () => {
    if (!completedReminder || !renewalDate) return;

    try {
      // Create new reminder for next year
      await dispatch(createReminder({
        name: completedReminder.name,
        type: completedReminder.type,
        expiryDate: new Date(renewalDate).toISOString(),
        renewalAmount: completedReminder.renewalAmount
      })).unwrap();
      
      // Delete old one
      await dispatch(deleteReminder(completedReminder.id)).unwrap();
      
      toast.success("Signal successfully renewed for next year.");
      setIsRenewModalOpen(false);
      setCompletedReminder(null);
    } catch {
      toast.error("Failed to sync renewal signal.");
    }
  };

  const sortedReminders = useMemo(() => {
    const list = viewArchive ? archivedReminders : reminders;
    return [...list].sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
  }, [reminders, archivedReminders, viewArchive]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Signal Horizon
          </h3>
          <p className="text-[8px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest leading-none">
            {viewArchive ? "Historical Expiry Logs" : "Omni-Channel Expiry Nodes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewArchive(!viewArchive)}
            className={`text-[8px] font-black uppercase px-3 py-1 rounded-full border transition-all tracking-[0.1em] ${
              viewArchive 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:border-primary/50"
            }`}
          >
            {viewArchive ? "Viewing Archive" : "View Archive"}
          </button>
          {!viewArchive && reminders.length > 0 && (
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-full border border-primary/20 tracking-[0.1em]">
              Active Monitoring
            </span>
          )}
        </div>
      </div>

      {sortedReminders.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl bg-white/50 dark:bg-slate-900/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {viewArchive ? "No archived signals found" : "No active signals configured"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <AnimatePresence mode="popLayout">
            {sortedReminders.map((reminder) => (
              <CountdownCard
                key={reminder.id}
                reminder={reminder}
                isArchived={viewArchive}
                onClick={() => !viewArchive && onEdit?.(reminder)}
                onComplete={() => handleComplete(reminder)}
                onDelete={() => {
                  setReminderToDelete(reminder);
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
          setReminderToDelete(null);
        }}
        onConfirm={async () => {
          if (!reminderToDelete) return;
          await dispatch(deleteReminder(reminderToDelete.id)).unwrap();
          toast.success("Signal terminated.");
          setIsDeleteModalOpen(false);
          setReminderToDelete(null);
        }}
        isDestructive={true}
        title="Terminate Signal"
        message="Decommissioning this signal node will stop active monitoring of this expiry. This operation is recorded."
        confirmText="Confirm Termination"
      />

      {/* Renewal / Completion Modal */}
      <AnimatePresence>
        {isRenewModalOpen && completedReminder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => {
                setIsRenewModalOpen(false);
                setCompletedReminder(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 p-8 overflow-hidden"
            >
              <div className="relative space-y-6 text-center">
                <div className="size-16 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Signal Completed</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Would you like to authorize a renewal signal for the next operational cycle?
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
                  <DateInput
                    label="Next Expiry Node"
                    value={renewalDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenewalDate(e.target.value)}
                  />
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={confirmRenewal}
                      className="w-full h-11 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Authorize Renewal
                    </button>
                    <button
                      onClick={confirmCompletion}
                      className="w-full h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      Archive Only
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsRenewModalOpen(false);
                    setCompletedReminder(null);
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
  reminder,
  isArchived = false,
  onClick,
  onComplete,
  onDelete,
}: {
  reminder: Reminder;
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
        new Date(reminder.expiryDate).getTime() - new Date().getTime();
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
  }, [reminder.expiryDate, isArchived]);

  const isCritical = !isArchived && timeLeft.days < 7;
  const isExpired =
    !isArchived && timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

  const Icon =
    reminder.type === "policy"
      ? ShieldAlert
      : reminder.type === "document"
        ? FileText
        : Activity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className={`group relative p-3.5 rounded-2xl border transition-all h-full flex flex-col justify-between ${
        !isArchived ? "cursor-pointer hover:border-primary/50" : "opacity-75 grayscale-[0.5]"
      } ${
        isCritical
          ? "bg-rose-50/20 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 shadow-sm"
          : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 shadow-sm"
      }`}
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div
            className={`p-1.5 rounded-lg border ${isCritical ? "bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-100 dark:border-rose-500/20" : "bg-indigo-50 dark:bg-indigo-500/10 text-primary border-indigo-100 dark:border-indigo-500/20"}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${
              isArchived
                ? "text-slate-500 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10"
                : isExpired
                  ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
                  : isCritical
                    ? "text-orange-600 bg-orange-500/10 border-orange-500/20"
                    : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            }`}
          >
            {isArchived ? "Completed" : isExpired ? "Expired" : isCritical ? "Urgent" : "Active"}
          </span>
        </div>

        <div className="min-w-0">
          <h4
            className={`text-sm font-black truncate tracking-tight ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
          >
            {reminder.name}
          </h4>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
            {isArchived 
              ? `Completed on ${reminder.deletedAt ? new Date(reminder.deletedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}` 
              : isExpired ? "EXPIRED" : `${timeLeft.days}D ${timeLeft.hours}H REMAINING`}
          </p>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-slate-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Nexus Cost
            </span>
            <span className={`text-[10px] font-black ${isCritical ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
              ₹{reminder.renewalAmount.toLocaleString()}
            </span>
          </div>

          {!isArchived && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                className="p-1 px-2 text-slate-300 hover:text-emerald-500 transition-colors"
                title="Complete Signal"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 px-2 text-slate-300 hover:text-rose-500 transition-colors"
                title="Archive Signal"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
