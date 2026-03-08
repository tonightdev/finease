"use client";

import { useState, useEffect } from "react";
import { Building2, CreditCard, Wallet, CheckCircle2 } from "lucide-react";
import { Account } from "@repo/types";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: string;
    balance: string;
    minimumBalance?: string;
    maxLimit?: string;
  }) => Promise<void> | void;
  account?: Account | null;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onSave,
  account,
}: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    balance: "",
    minimumBalance: "",
    maxLimit: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (account) {
        setFormData({
          name: account.name,
          type: account.type,
          balance: String(account.balance),
          minimumBalance: account.minimumBalance?.toString() || "",
          maxLimit: account.maxLimit?.toString() || "",
        });
      } else {
        setFormData({
          name: "",
          type: "bank",
          balance: "",
          minimumBalance: "",
          maxLimit: "",
        });
      }
    }
  }, [account, isOpen]);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter an account name");
      return;
    }
    if (!formData.balance) {
      toast.error("Please enter an initial balance");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success(
        account ? "Account updated successfully" : "Account added successfully",
      );
      onClose();
    } catch {
      // toast.error is usually handled by the caller or slice
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? "Asset Identity" : "New Node"}
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
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Commit State
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Identification
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. HDFC Core"
            className="w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Node Class
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "bank", icon: Building2, label: "Bank" },
              { id: "card", icon: CreditCard, label: "Card" },
              { id: "cash", icon: Wallet, label: "Cash" },
            ].map((node) => (
              <button
                key={node.id}
                disabled={!!account || isSaving}
                onClick={(e) => {
                  e.preventDefault();
                  setFormData({ ...formData, type: node.id });
                }}
                className={`h-9 rounded-xl border-none ring-1 flex flex-col items-center justify-center gap-1 transition-all ${
                  formData.type === node.id
                    ? "bg-primary text-white ring-primary shadow-lg shadow-primary/20"
                    : "bg-slate-50 dark:bg-slate-950 ring-slate-100 dark:ring-white/5 text-slate-400 hover:ring-slate-200 dark:hover:ring-white/10"
                }`}
              >
                <node.icon className="w-3.5 h-3.5" />
                <span className="text-[8px] font-black uppercase tracking-widest">
                  {node.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between px-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Liquid Value (₹)
            </label>
            {account && (
              <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                Read-Only
              </span>
            )}
          </div>
          <AmountInput
            value={formData.balance}
            onChange={(val) => setFormData({ ...formData, balance: val })}
            placeholder="0.00"
            disabled={!!account || isSaving}
            className={account ? "bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-200 dark:ring-white/5 cursor-not-allowed" : ""}
          />
        </div>

        {formData.type === "bank" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
              Threshold (₹)
            </label>
            <AmountInput
              value={formData.minimumBalance}
              onChange={(val) => setFormData({ ...formData, minimumBalance: val })}
              placeholder="Minimum..."
            />
          </div>
        )}

        {formData.type === "card" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1">
              Node Limit (₹)
            </label>
            <AmountInput
              value={formData.maxLimit}
              onChange={(val) => setFormData({ ...formData, maxLimit: val })}
              placeholder="Total credit limit..."
              className="bg-primary/5 dark:bg-primary/10 text-primary ring-primary/20 focus:ring-primary"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
