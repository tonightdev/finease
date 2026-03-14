"use client";

import { useState, useEffect } from "react";
import { Gem } from "lucide-react";
import { type Account } from "@repo/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Partial<Account>;
  onSave: (data: { name: string; balance: string; excludeFromAnalytics?: boolean }) => Promise<void> | void;
}

export function AddAssetModal({
  isOpen,
  onClose,
  asset,
  onSave,
}: AddAssetModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    excludeFromAnalytics: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name ?? "",
        balance: (asset.balance ?? 0).toString(),
        excludeFromAnalytics: asset.excludeFromAnalytics ?? false,
      });
    } else {
      setFormData({
        name: "",
        balance: "",
        excludeFromAnalytics: false,
      });
    }
  }, [asset, isOpen]);

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
      title={asset ? "Asset Refinement" : "Physical Asset Node"}
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
            leftIcon={<Gem className="w-4 h-4" />}
          >
            {asset ? "Update Asset" : "Commit Asset"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Asset Identifier
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
            placeholder="e.g. Gold, Real Estate"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Current Valuation (₹)
          </label>
          <AmountInput
            value={formData.balance}
            onChange={(val) => setFormData({ ...formData, balance: val })}
            disabled={isSaving}
            placeholder="0.00"
          />
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
