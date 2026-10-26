"use client";

import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import { type Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";
import toast from "react-hot-toast";

interface AddLiabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  liability?: Partial<Account>;
  onSave: (data: {
    name: string;
    type: string;
    initialAmount: string;
    repaidCapital: string;
    burnedInterest: string;
    excludeFromAnalytics?: boolean;
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
    repaidCapital: "",
    burnedInterest: "",
    excludeFromAnalytics: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (liability) {
        const absBalance = Math.abs(liability.balance ?? 0);
        const totalLoan =
          liability.initialAmount && Number(liability.initialAmount) > 0
            ? Number(liability.initialAmount)
            : absBalance + (liability.repaidCapital ?? 0);
        setFormData({
          name: liability.name ?? "",
          type: liability.type ?? "debt",
          initialAmount: totalLoan > 0 ? totalLoan.toString() : "",
          repaidCapital: (liability.repaidCapital ?? 0).toString(),
          burnedInterest: (liability.burnedInterest ?? 0).toString(),
          excludeFromAnalytics: liability.excludeFromAnalytics ?? false,
        });
      } else {
        setFormData({
          name: "",
          type: "debt",
          initialAmount: "",
          repaidCapital: "0",
          burnedInterest: "0",
          excludeFromAnalytics: false,
        });
      }
    }
  }, [liability, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a loan or liability name");
      return;
    }
    const totalLoanNum = parseFloat(formData.initialAmount);
    if (!formData.initialAmount || isNaN(totalLoanNum) || totalLoanNum <= 0) {
      toast.error("Please enter a valid total loan amount");
      return;
    }
    const repaidNum = parseFloat(formData.repaidCapital);
    if (isNaN(repaidNum) || repaidNum < 0) {
      toast.error("Please enter a valid paid actual amount (0 or more)");
      return;
    }
    const interestNum = parseFloat(formData.burnedInterest);
    if (isNaN(interestNum) || interestNum < 0) {
      toast.error("Please enter a valid paid interest amount (0 or more)");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save loan";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={liability ? "Edit Loan / Liability" : "Add Loan / Liability"}
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
            Save Loan
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Loan / Liability Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Home Loan, Car Loan, Personal Loan"
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Total Amount (₹)
          </label>
          <AmountInput
            value={formData.initialAmount}
            onChange={(val) => setFormData({ ...formData, initialAmount: val })}
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px] space-y-1.5">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">
              Paid Actual Amount (₹)
            </label>
            <AmountInput
              value={formData.repaidCapital}
              onChange={(val) =>
                setFormData({ ...formData, repaidCapital: val })
              }
              placeholder="0.00"
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 ring-emerald-500/20 focus:ring-emerald-500"
            />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1.5">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest pl-1">
              Paid Interest (₹)
            </label>
            <AmountInput
              value={formData.burnedInterest}
              onChange={(val) =>
                setFormData({ ...formData, burnedInterest: val })
              }
              placeholder="0.00"
              className="bg-orange-50 dark:bg-orange-500/10 text-orange-500 ring-orange-500/20 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Real-time Summary Card */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-100 dark:border-white/5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Total Amount Paid
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              ₹
              {(
                (parseFloat(formData.repaidCapital) || 0) +
                (parseFloat(formData.burnedInterest) || 0)
              ).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-400 uppercase tracking-wider">
              Net Balance Remaining
            </span>
            <span className="font-black text-rose-500">
              ₹
              {Math.max(
                0,
                (parseFloat(formData.initialAmount) || 0) -
                  (parseFloat(formData.repaidCapital) || 0),
              ).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            role="switch"
            aria-checked={formData.excludeFromAnalytics}
            onClick={() =>
              setFormData({
                ...formData,
                excludeFromAnalytics: !formData.excludeFromAnalytics,
              })
            }
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              formData.excludeFromAnalytics
                ? "bg-primary"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.excludeFromAnalytics
                  ? "translate-x-3"
                  : "translate-x-0"
              }`}
            />
          </button>
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">
              Exclude from Analytics
            </label>
            <span className="text-[8px] text-slate-400 font-medium">
              Hides loan from net worth & dashboard
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
