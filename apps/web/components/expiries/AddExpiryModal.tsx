"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  IndianRupee,
  ShieldAlert,
  FileText,
  Activity,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Expiry } from "@repo/types";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

interface AddExpiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    data: Omit<Expiry, "id" | "userId" | "createdAt">,
  ) => Promise<void> | void;
  expiry?: Expiry | null;
}

export function AddExpiryModal({
  isOpen,
  onClose,
  onSave,
  expiry,
}: AddExpiryModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    type: Expiry["type"];
    expiryDate: string;
    renewalAmount: string;
  }>({
    name: "",
    type: "policy",
    expiryDate: "",
    renewalAmount: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (expiry) {
        setFormData({
          name: expiry.name || "",
          type: expiry.type || "policy",
          expiryDate: expiry.expiryDate
            ? expiry.expiryDate.split("T")[0] || ""
            : "",
          renewalAmount:
            expiry.renewalAmount && expiry.renewalAmount > 0
              ? String(expiry.renewalAmount)
              : "",
        });
      } else {
        setFormData({
          name: "",
          type: "policy",
          expiryDate: new Date().toISOString().split("T")[0] || "",
          renewalAmount: "",
        });
      }
    }
  }, [expiry, isOpen]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter an expiry name");
      return;
    }

    if (!formData.expiryDate) {
      toast.error("Please select an expiry date");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        type: formData.type,
        expiryDate: new Date(formData.expiryDate).toISOString(),
        renewalAmount: parseFloat(formData.renewalAmount) || 0,
        metadata: expiry?.metadata || {},
      });
      onClose();
    } catch {
      // Error handled by parent toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expiry ? "Edit Expiry" : "New Expiry"}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => handleSave()}
            isLoading={isSaving}
            className="flex-[2] h-10 rounded-xl font-bold text-xs uppercase tracking-wider"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {expiry ? "Update Expiry" : "Save Expiry"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Expiry Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Expiry Name
          </label>
          <div className="relative group">
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g. Life Insurance, Passport, Driving License"
              className="h-10 pl-10 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
              autoFocus
            />
            <Bell className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Category (Interactive Pills) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "policy", icon: ShieldAlert, label: "Policy" },
              { id: "document", icon: FileText, label: "Document" },
              { id: "other", icon: Activity, label: "Other" },
            ].map((cat) => {
              const isSelected = formData.type === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: cat.id as Expiry["type"],
                    })
                  }
                  className={`h-10 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold select-none ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
                  }`}
                >
                  <cat.icon className="size-3.5 shrink-0" />
                  <span className="text-[10px] uppercase tracking-wider">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Renewal Amount */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Renewal Amount (₹)
            </label>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Optional (0 if none)
            </span>
          </div>
          <div className="relative group">
            <AmountInput
              value={formData.renewalAmount}
              onChange={(val) =>
                setFormData({ ...formData, renewalAmount: val })
              }
              placeholder="0.00"
              disabled={isSaving}
              className="h-10 pl-10 text-xs sm:text-sm font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 ring-0 focus:ring-2 focus:ring-primary focus:border-transparent rounded-xl placeholder:text-slate-400 placeholder:text-xs placeholder:font-normal"
            />
            <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Expiry Date
          </label>
          <div className="relative group">
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
              disabled={isSaving}
              className="w-full h-10 px-3 pl-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs sm:text-sm font-bold text-slate-900 dark:text-white disabled:opacity-50 appearance-none"
            />
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </div>
      </form>
    </Modal>
  );
}
