"use client";

import { useState, useEffect } from "react";
import { DateInput } from "@/components/ui/DateInput";
import { ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

import {
  Transaction,
  TransactionFrequency,
  FinancialGoal,
  Category,
} from "@repo/types";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => Promise<void> | void;
  transaction?: Transaction | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
}: TransactionModalProps) {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    interestAmount: string;
    category: string;
    date: string;
    accountId: string;
    toAccountId: string;
    type: "expense" | "income" | "transfer";
    isAutomated: boolean;
    frequency: TransactionFrequency;
    recurringCount: string;
  }>({
    description: "",
    amount: "",
    interestAmount: "",
    category: "uncategorized",
    date: new Date().toISOString().split("T")[0] ?? "",
    accountId: "acc-1",
    toAccountId: "",
    type: "expense",
    isAutomated: false,
    frequency: "monthly",
    recurringCount: "12",
  });

  useEffect(() => {
    if (isOpen) {
      const defaultCategory = categories?.[0]?.id || "uncategorized";
      if (transaction) {
        setFormData({
          description: transaction.description,
          amount: String(transaction.amount),
          interestAmount: transaction.interestAmount
            ? String(transaction.interestAmount)
            : "",
          category: transaction.category || defaultCategory,
          date: new Date(transaction.date).toISOString().split("T")[0] ?? "",
          accountId: transaction.accountId || "acc-1",
          toAccountId: transaction.toAccountId || "",
          type: transaction.type || "expense",
          isAutomated: transaction.isAutomated || false,
          frequency: transaction.frequency || "monthly",
          recurringCount: String(transaction.recurringCount || 12),
        });
      } else {
        setFormData({
          description: "",
          amount: "",
          interestAmount: "",
          category: defaultCategory,
          date: new Date().toISOString().split("T")[0] ?? "",
          accountId: accounts[0]?.id || "acc-1",
          toAccountId: "",
          type: "expense",
          isAutomated: false,
          frequency: "monthly",
          recurringCount: "12",
        });
      }
    }
  }, [transaction, isOpen, accounts, categories]);

  const handleSave = async () => {
    if (!formData.description || !formData.amount) {
      toast.error("Please fill required fields (description & amount)");
      return;
    }
    if (!formData.accountId) {
      toast.error("Please select a primary account");
      return;
    }
    if (formData.type === "transfer" && !formData.toAccountId) {
      toast.error("Please select a destination account for the transfer");
      return;
    }
    if (formData.accountId === formData.toAccountId) {
      toast.error("Source and destination accounts cannot be the same");
      return;
    }

    const amount = parseFloat(formData.amount);
    const interest = formData.interestAmount
      ? parseFloat(formData.interestAmount)
      : 0;

    if (interest > amount) {
      toast.error(
        `Interest portion (₹${interest.toLocaleString()}) cannot be greater than total amount (₹${amount.toLocaleString()})`,
      );
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Transaction> = {
        ...formData,
        amount: parseFloat(formData.amount),
        interestAmount: formData.interestAmount
          ? parseFloat(formData.interestAmount)
          : undefined,
        recurringCount: formData.recurringCount,
      };
      await onSave(payload);
      toast.success(transaction ? "Transaction updated" : "Transaction added");
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
      title={transaction ? "Edit Record" : "New Record"}
      footer={
        <Button onClick={handleSave} isLoading={isSaving} className="w-full">
          {transaction ? "Update Entry" : "Commit Record"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Merchant / Narration
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            disabled={isSaving}
            placeholder="e.g. Grocery, Salary..."
            className="w-full p-2.5 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
          />
        </div>

        <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Flow Type
            </label>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
              <button
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, type: "expense" })}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === "expense" ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm" : "text-slate-500"} disabled:opacity-50`}
              >
                Out
              </button>
              <button
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, type: "income", toAccountId: "" })}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === "income" ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-sm" : "text-slate-500"} disabled:opacity-50`}
              >
                In
              </button>
              <button
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, type: "transfer" })}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === "transfer" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"} disabled:opacity-50`}
              >
                Move
              </button>
            </div>
          </div>

            <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Execution
            </label>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
              <button
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, isAutomated: false })}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!formData.isAutomated ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"} disabled:opacity-50`}
              >
                One
              </button>
              <button
                disabled={isSaving}
                onClick={() => setFormData({ ...formData, isAutomated: true })}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.isAutomated ? "bg-white dark:bg-slate-800 text-purple-500 shadow-sm" : "text-slate-500"} disabled:opacity-50`}
              >
                Recur
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Amount (₹)
          </label>
          <AmountInput
            value={formData.amount}
            onChange={(val) => setFormData({ ...formData, amount: val })}
            placeholder="0.00"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-4">
          {formData.type === "expense" ? (
            <div className="flex flex-col gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Pay From
                </label>
                <div className="relative">
                  <select
                    value={formData.accountId}
                    onChange={(e) => {
                      const newAccId = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        accountId: newAccId,
                        toAccountId: prev.toAccountId === newAccId ? "" : prev.toAccountId
                      }));
                    }}
                    disabled={isSaving}
                    className="w-full p-2.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select Source
                    </option>
                    <optgroup label="Bank Accounts">
                      {accounts.filter(a => !a.isClosed && a.type === 'bank').map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cash & Others">
                      {accounts.filter(a => !a.isClosed && ['cash', 'card'].includes(a.type)).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Credit To (Optional)
                </label>
                <div className="relative">
                  <select
                    value={formData.toAccountId}
                    onChange={(e) => {
                      const newToId = e.target.value;
                      const targetAccount = accounts.find(a => a.id === newToId);
                      const isInternal = targetAccount && ["bank", "cash", "card", "investment"].includes(targetAccount.type);
                      
                      setFormData(prev => ({ 
                        ...prev, 
                        toAccountId: newToId,
                        type: isInternal ? "transfer" : prev.type
                      }));
                    }}
                    disabled={isSaving}
                    className="w-full p-2.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="">(None)</option>
                    <optgroup label="Debts & Loans">
                      {accounts
                        .filter(acc => !acc.isClosed && acc.type === 'debt' && acc.id !== formData.accountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (₹{Math.abs(acc.balance).toLocaleString()})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bank Accounts">
                      {accounts
                        .filter(acc => !acc.isClosed && acc.type === 'bank' && acc.id !== formData.accountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (₹{acc.balance.toLocaleString()})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Cash & Others">
                      {accounts
                        .filter(acc => !acc.isClosed && ['cash', 'card'].includes(acc.type) && acc.id !== formData.accountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (₹{acc.balance.toLocaleString()})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Investments">
                      {accounts
                        .filter(acc => !acc.isClosed && acc.type === 'investment' && acc.id !== formData.accountId)
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} (₹{acc.balance.toLocaleString()})
                          </option>
                        ))}
                    </optgroup>
                    {goals && goals.length > 0 && (
                      <optgroup label="Financial Goals">
                        {goals.map((g: FinancialGoal) => (
                          <option key={g.id} value={g.id}>
                            {g.name} (₹{g.currentAmount.toLocaleString()})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {accounts.find((a) => a.id === formData.toAccountId)?.type ===
                  "debt" && (
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Interest Portion (₹)
                    </label>
                    <AmountInput
                      value={formData.interestAmount}
                      onChange={(val) =>
                        setFormData({
                          ...formData,
                          interestAmount: val,
                        })
                      }
                      disabled={isSaving}
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : formData.type === "transfer" ? (
            <div className="flex flex-col gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  From Account
                </label>
                <div className="relative">
                  <select
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData({ ...formData, accountId: e.target.value })
                    }
                    disabled={isSaving}
                    className="w-full p-2.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select Source
                    </option>
                    <optgroup label="Bank Accounts">
                      {accounts.filter(a => !a.isClosed && a.type === 'bank').map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cash & Others">
                      {accounts.filter(a => !a.isClosed && ['cash', 'card'].includes(a.type)).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  To Account
                </label>
                <div className="relative">
                  <select
                    value={formData.toAccountId}
                    onChange={(e) =>
                      setFormData({ ...formData, toAccountId: e.target.value })
                    }
                    disabled={isSaving}
                    className="w-full p-2.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
                  >
                    <option value="" disabled>Select Destination</option>
                    <optgroup label="Bank Accounts">
                      {accounts.filter(a => !a.isClosed && a.type === 'bank' && a.id !== formData.accountId).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Cash & Others">
                      {accounts.filter(a => !a.isClosed && ['cash', 'card'].includes(a.type) && a.id !== formData.accountId).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                    <optgroup label="Investments">
                      {accounts.filter(a => !a.isClosed && a.type === 'investment' && a.id !== formData.accountId).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Deposit To
              </label>
              <div className="relative">
                <select
                  value={formData.accountId}
                  onChange={(e) =>
                    setFormData({ ...formData, accountId: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full p-2.5 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs text-slate-900 dark:text-white font-medium disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select Destination
                  </option>
                  <optgroup label="Bank Accounts">
                    {accounts.filter(a => !a.isClosed && a.type === 'bank').map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Cash & Others">
                    {accounts.filter(a => !a.isClosed && ['cash', 'card'].includes(a.type)).map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Investments">
                    {accounts.filter(a => !a.isClosed && a.type === 'investment').map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <DateInput
              label="Date"
              value={formData.date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, date: e.target.value })
              }
              disabled={isSaving}
            />
          </div>
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Category
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                disabled={isSaving}
                className="w-full h-12 p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm text-slate-900 dark:text-white font-medium disabled:opacity-50"
              >
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {formData.isAutomated && (
          <div className="p-3 bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl border border-purple-500/10 space-y-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1">
                  Frequency
                </label>
                <div className="relative">
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        frequency: e.target.value as TransactionFrequency,
                      })
                    }
                    disabled={isSaving}
                    className="w-full p-2 bg-white dark:bg-[#0b0d12] border border-purple-500/20 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-[10px] font-bold text-purple-600 dark:text-purple-400 disabled:opacity-50"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className="flex-1 min-w-[120px] space-y-1">
                <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1">
                  Occurrences
                </label>
                <input
                  type="number"
                  value={formData.recurringCount}
                  onChange={(e) =>
                    setFormData({ ...formData, recurringCount: e.target.value })
                  }
                  disabled={isSaving}
                  className="w-full p-2 bg-white dark:bg-[#0b0d12] border border-purple-500/20 rounded-xl focus:ring-2 focus:ring-purple-500 transition-all outline-none text-[10px] font-bold text-purple-600 dark:text-purple-400 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
