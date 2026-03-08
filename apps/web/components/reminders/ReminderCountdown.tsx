"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldAlert, FileText, Activity, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Reminder, deleteReminder } from "@/store/slices/remindersSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import toast from "react-hot-toast";

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
  const dispatch = useDispatch<AppDispatch>();

  const sortedReminders = useMemo(() => {
    return [...reminders].sort(
      (a, b) =>
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime(),
    );
  }, [reminders]);

  if (reminders.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Signal Horizon
          </h3>
          <p className="text-[8px] font-bold text-slate-500 mt-0.5 uppercase tracking-widest leading-none">
            Omni-Channel Expiry Nodes
          </p>
        </div>
        <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-full border border-primary/20 tracking-[0.1em]">
          Active Monitoring
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <AnimatePresence mode="popLayout">
          {sortedReminders.map((reminder) => (
            <CountdownCard
              key={reminder.id}
              reminder={reminder}
              onClick={() => onEdit?.(reminder)}
              onDelete={() => {
                setReminderToDelete(reminder);
                setIsDeleteModalOpen(true);
              }}
            />
          ))}
        </AnimatePresence>
      </div>

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
    </div>
  );
}

function CountdownCard({
  reminder,
  onClick,
  onDelete,
}: {
  reminder: Reminder;
  onClick?: () => void;
  onDelete: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
  }>({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
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
  }, [reminder.expiryDate]);

  const isCritical = timeLeft.days < 7;
  const isExpired =
    timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0;

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
      className={`group relative p-3.5 rounded-2xl border transition-all h-full flex flex-col justify-between cursor-pointer hover:border-primary/50 ${
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
              isExpired
                ? "text-rose-600 bg-rose-500/10 border-rose-500/20"
                : isCritical
                  ? "text-orange-600 bg-orange-500/10 border-orange-500/20"
                  : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            }`}
          >
            {isExpired ? "Expired" : isCritical ? "Urgent" : "Active"}
          </span>
        </div>

        <div className="min-w-0">
          <h4
            className={`text-sm font-black truncate tracking-tight ${isCritical ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"}`}
          >
            {reminder.name}
          </h4>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isExpired ? "EXPIRED" : `${timeLeft.days}D ${timeLeft.hours}H REMAINING`}
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 px-2 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
