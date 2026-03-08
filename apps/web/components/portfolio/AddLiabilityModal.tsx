"use client";

import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import { type Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface AddLiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  liability?: Partial<Account>;
  onSave: (data: {
    name: string;
    type: string;
    initialAmount: string;
    paidAmount: string;
    interestPaid: string;
  }) => Promise<void> | void;
}

export function AddLiabilityModal({
  isOpen,
  onClose,
  liability,
  onSave,
}: AddLiabilityModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "debt",
    initialAmount: "",
    paidAmount: "",
    interestPaid: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (liability) {
        const absBalance = Math.abs(liability.balance ?? 0);
        setFormData({
          name: liability.name ?? "",
          type: liability.type ?? "debt",
          initialAmount:
            liability.initialAmount?.toString() ||
            (absBalance + (liability.paidAmount ?? 0)).toString(),
          paidAmount: liability.paidAmount?.toString() ?? "0",
          interestPaid: liability.interestPaid?.toString() ?? "0",
        });
      } else {
        setFormData({
          name: "",
          type: "debt",
          initialAmount: "",
          paidAmount: "0",
          interestPaid: "0",
        });
      }
    }
  }, [liability, isOpen]);

  const handleSubmit = async () => {
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
      title={liability ? "Debt Refinement" : "Liability Node"}
      maxWidth="max-w-sm"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSaving}
            className="flex-[2]"
            leftIcon={<Home className="w-4 h-4" />}
          >
            Commit Debt
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Instrument Label
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Home Loan"
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Total Obligation (₹)
          </label>
          <AmountInput
            value={formData.initialAmount}
            onChange={(val) => setFormData({ ...formData, initialAmount: val })}
            placeholder="0.00"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">
              Principal (₹)
            </label>
            <AmountInput
              value={formData.paidAmount}
              onChange={(val) => setFormData({ ...formData, paidAmount: val })}
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 ring-emerald-500/20 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest pl-1">
              Cost (₹)
            </label>
            <AmountInput
              value={formData.interestPaid}
              onChange={(val) => setFormData({ ...formData, interestPaid: val })}
              className="bg-orange-50 dark:bg-orange-500/10 text-orange-500 ring-orange-500/20 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
