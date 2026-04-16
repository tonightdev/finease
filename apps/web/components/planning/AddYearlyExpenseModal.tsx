"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";
import { Target, Banknote, ShieldCheck } from "lucide-react";
import { YearlyExpense } from "@/store/slices/yearlySlice";

interface YearlyExpenseFormData {
  title: string;
  yearlyAmount: number;
  accountId: string;
}

interface AddYearlyExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: YearlyExpenseFormData) => Promise<void>;
  editingExpense?: YearlyExpense | null;
}

export function AddYearlyExpenseModal({
  isOpen,
  onClose,
  onSave,
  editingExpense,
}: AddYearlyExpenseModalProps) {
  const allAccounts = useSelector((state: RootState) => state.accounts.items);

  // Only allow liquid nodes (Bank, Cash, Card) as per user request
  const accounts = useMemo(() => allAccounts.filter(acc =>
    ["bank", "cash"].includes(acc.type) && !acc.isClosed
  ), [allAccounts]);

  const [formData, setFormData] = useState<YearlyExpenseFormData>({
    title: "",
    yearlyAmount: 0,
    accountId: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingExpense) {
        setFormData({
          title: editingExpense.title,
          yearlyAmount: editingExpense.yearlyAmount,
          accountId: editingExpense.accountId,
        });
      } else {
        setFormData({
          title: "",
          yearlyAmount: 0,
          accountId: formData.accountId || accounts[0]?.id || "",
        });
      }
    }
  }, [isOpen, editingExpense]);

  // Set default account if none selected and accounts are available
  useEffect(() => {
    if (isOpen && !formData.accountId && accounts.length > 0) {
      setFormData(prev => ({ ...prev, accountId: accounts[0]?.id || "" }));
    }
  }, [accounts, isOpen, formData.accountId]);

  const handleSave = async () => {
    if (!formData.title || formData.yearlyAmount <= 0 || !formData.accountId) return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save failure:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingExpense ? "Update Expenditure" : "New Yearly Commitment"}
      maxWidth="max-w-sm"
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
            leftIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Commit
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Commitment Title
          </label>
          <div className="relative group">
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Life Insurance"
              className="w-full h-12 pl-11 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <Target className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Target Account (Node)
          </label>
          <div className="relative group">
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="w-full h-12 pl-11 pr-10 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-[11px] font-bold text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
            >
              {accounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (₹{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
            Yearly Magnitude (₹)
          </label>
          <AmountInput
            value={formData.yearlyAmount === 0 ? "" : String(formData.yearlyAmount)}
            onChange={(val) => setFormData({ ...formData, yearlyAmount: Number(val) })}
            placeholder="0.00"
            disabled={isSaving}
          />
          <div className="pt-2 px-1">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">
              Estimated Monthly Burden: ₹{(formData.yearlyAmount / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
