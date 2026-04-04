"use client";

import { useState, useEffect } from "react";
import { ChevronDown, TrendingUp } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Account } from "@repo/types";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    assetName: string;
    assetType: string;
    investedAmount: string;
    currentAmount: string;
    excludeFromAnalytics?: boolean;
  }) => Promise<void> | void;
  investment?: Account | null;
}

export function AddInvestmentModal({
  isOpen,
  onClose,
  onSave,
  investment,
}: AddInvestmentModalProps) {
  const assetTypes = useSelector(
    (state: RootState) => state.assetClasses.items,
  );
  const [formData, setFormData] = useState({
    assetName: "",
    assetType: "",
    investedAmount: "",
    currentAmount: "",
    excludeFromAnalytics: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (investment) {
        setFormData({
          assetName: investment.name,
          assetType: investment.assetType || assetTypes[0]?.id || "",
          investedAmount: String(
            investment.investedAmount || investment.balance,
          ),
          currentAmount: String(investment.balance),
          excludeFromAnalytics: investment.excludeFromAnalytics ?? false,
        });
      } else {
        setFormData({
          assetName: "",
          assetType: assetTypes[0]?.id || "",
          investedAmount: "",
          currentAmount: "",
          excludeFromAnalytics: false,
        });
      }
    }
  }, [investment, isOpen, assetTypes]);

  const handleSave = async () => {
    if (!formData.assetName) {
      toast.error("Please enter an asset name");
      return;
    }
    if (!formData.assetType) {
      toast.error("Please select an asset class");
      return;
    }
    if (!formData.investedAmount) {
      toast.error("Please enter capital invested");
      return;
    }
    if (!formData.currentAmount) {
      toast.error("Please enter current value");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success(
        investment
          ? "Investment updated successfully"
          : "Investment logged successfully",
      );
      onClose();
    } catch {
      // toast.error("Failed to save investment");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={investment ? "Asset Strategy" : "Capital Growth"}
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
            onClick={handleSave}
            isLoading={isSaving}
            className="flex-[2]"
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            Commit Force
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Instrument / Ticker
          </label>
          <input
            type="text"
            value={formData.assetName}
            onChange={(e) =>
              setFormData({ ...formData, assetName: e.target.value })
            }
            placeholder="e.g. BTC-INR or NIFTY 50"
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Asset Category
          </label>
          <div className="relative">
            <select
              value={formData.assetType}
              onChange={(e) =>
                setFormData({ ...formData, assetType: e.target.value })
              }
              className="w-full h-10 appearance-none bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all"
            >
              <option value="" disabled>
                Select Sector
              </option>
              {assetTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px] space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Basis (Capital)
            </label>
            <AmountInput
              value={formData.investedAmount}
              onChange={(val) => setFormData({ ...formData, investedAmount: val })}
              placeholder="0.00"
              disabled={!!investment || isSaving}
              className={investment ? "bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-200 dark:ring-white/5 cursor-not-allowed" : ""}
            />
          </div>
          <div className="flex-1 min-w-[120px] space-y-1.5">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">
              Valuation
            </label>
            <AmountInput
              value={formData.currentAmount}
              onChange={(val) => setFormData({ ...formData, currentAmount: val })}
              placeholder="0.00"
              className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 ring-emerald-500/20 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            role="switch"
            aria-checked={formData.excludeFromAnalytics}
            onClick={() => setFormData({ ...formData, excludeFromAnalytics: !formData.excludeFromAnalytics })}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              formData.excludeFromAnalytics ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                formData.excludeFromAnalytics ? 'translate-x-3' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex flex-col">
             <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest leading-none">
               Exclude from Analytics
             </label>
             <span className="text-[8px] text-slate-400 font-medium">
               Hides node from net worth & dashboard
             </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
