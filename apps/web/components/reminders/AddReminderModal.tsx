"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, IndianRupee } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Reminder } from "@/store/slices/remindersSlice";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reminder, "id">) => Promise<void> | void;
  reminder?: Reminder | null;
}

export function AddReminderModal({
  isOpen,
  onClose,
  onSave,
  reminder,
}: AddReminderModalProps) {
  const [formData, setFormData] = useState<Omit<Reminder, "id">>({
    name: "",
    type: "policy",
    expiryDate: "",
    renewalAmount: 0,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (reminder) {
      setFormData({
        name: reminder.name,
        type: reminder.type,
        expiryDate: reminder.expiryDate.split("T")[0] || "",
        renewalAmount: reminder.renewalAmount,
      });
    } else {
      setFormData({
        name: "",
        type: "policy",
        expiryDate: "",
        renewalAmount: 0,
      });
    }
  }, [reminder, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={reminder ? "Update Sequence" : "New Expiry Node"}
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Abort
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex-[2]"
            leftIcon={<Bell className="w-4 h-4" />}
          >
            Establish Signal
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Signal Identifier
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. LIC Policy, Passport Expiry"
            className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Signal Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as Reminder["type"],
                })
              }
              className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="policy">Policy</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Renewal Magnitude
            </label>
            <div className="relative">
              <AmountInput
                value={String(formData.renewalAmount || "")}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    renewalAmount: Number(val),
                  })
                }
                disabled={isSaving}
                className="pl-10"
                placeholder="0.00"
              />
              <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Horizon Date (Expiration)
          </label>
          <div className="relative group">
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl pl-10 pr-4 text-sm font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            />
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
