"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import toast from "react-hot-toast";

import { Transaction, TransactionFrequency, FinancialGoal, Category } from "@repo/types";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => void;
  transaction?: Transaction | null; // The initial transaction to edit
}

export function TransactionModal({ isOpen, onClose, onSave, transaction }: TransactionModalProps) {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);
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
      if (transaction) {
        setFormData({
          description: transaction.description,
          amount: String(transaction.amount),
          interestAmount: transaction.interestAmount ? String(transaction.interestAmount) : "",
          category: transaction.category || "uncategorized",
          date: new Date(transaction.date).toISOString().split("T")[0] ?? "",
          accountId: transaction.accountId || "acc-1",
          toAccountId: transaction.toAccountId || "",
          type: transaction.type || "expense",
          isAutomated: transaction.isAutomated || false,
          frequency: (transaction.frequency ?? "monthly") as TransactionFrequency,
          recurringCount: String(transaction.recurringCount || "12"),
        });
      } else {
        const defaultAcc = accounts.find(a => a.type !== "investment");
        setFormData({
          description: "",
          amount: "",
          interestAmount: "",
          category: "uncategorized",
          date: new Date().toISOString().split("T")[0] ?? "",
          accountId: defaultAcc ? defaultAcc.id : "",
          toAccountId: "",
          type: "expense",
          isAutomated: false,
          frequency: "monthly",
          recurringCount: "12",
        });
      }
    } else {
      setTimeout(() => {
        const defaultAcc = accounts.find(a => a.type !== "investment");
        setFormData({
          description: "",
          amount: "",
          interestAmount: "",
          category: "uncategorized",
          date: new Date().toISOString().split("T")[0] ?? "",
          accountId: defaultAcc ? defaultAcc.id : "",
          toAccountId: "",
          type: "expense",
          isAutomated: false,
          frequency: "monthly",
          recurringCount: "12",
        });
      }, 300);
    }
  }, [transaction, isOpen, accounts]);

  const handleSave = () => {
    if (!formData.description || !formData.amount) {
      toast.error("Please fill required fields (description & amount)");
      return;
    }
    if (!formData.accountId) {
      toast.error("Please select a primary account");
      return;
    }
    const payload: Partial<Transaction> = {
      ...formData,
      amount: parseFloat(formData.amount),
      interestAmount: formData.interestAmount ? parseFloat(formData.interestAmount) : undefined,
      recurringCount: formData.recurringCount,
    };
    onSave(payload);
    toast.success(transaction ? "Transaction updated" : "Transaction added");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-border-dark flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {transaction ? "Edit Transaction" : "New Transaction"}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Merchant / Description</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Grocery shopping, Netflix subscription..."
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Transaction Type</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                    className={`flex-1 p-3 rounded-xl border font-bold text-sm transition-all ${formData.type === "expense" ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#0b0d12] dark:border-border-dark dark:text-slate-400 hover:border-slate-300"}`}
                  >
                    Money Out (Expense)
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, type: "income" })}
                    className={`flex-1 p-3 rounded-xl border font-bold text-sm transition-all ${formData.type === "income" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#0b0d12] dark:border-border-dark dark:text-slate-400 hover:border-slate-300"}`}
                  >
                    Money In (Income)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Execution Type</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, isAutomated: false })}
                    className={`flex-1 p-3 rounded-xl border font-bold text-sm transition-all ${!formData.isAutomated ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#0b0d12] dark:border-border-dark dark:text-slate-400 hover:border-slate-300"}`}
                  >
                    Actual Transaction
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, isAutomated: true })}
                    className={`flex-1 p-3 rounded-xl border font-bold text-sm transition-all ${formData.isAutomated ? "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20" : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-[#0b0d12] dark:border-border-dark dark:text-slate-400 hover:border-slate-300"}`}
                  >
                    Automated Recurring
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Amount (₹)</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="space-y-4">
                {formData.type === "expense" ? (
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deduct From Account</label>
                      <div className="relative">
                        <select 
                          value={formData.accountId}
                          onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                          className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                        >
                          <option value="" disabled>Select an account</option>
                          {accounts.filter(a => ["bank", "cash", "card"].includes(a.type)).map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type.toUpperCase()}) - ₹{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Credit To Account / Investment</label>
                      <div className="relative">
                        <select 
                          value={formData.toAccountId}
                          onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                          className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                        >
                          <option value="">(None)</option>
                          <optgroup label="Accounts & Investments">
                            {accounts.filter(acc => acc.id !== formData.accountId && acc.type !== 'asset').map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.type.toUpperCase()}) - ₹{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </option>
                            ))}
                          </optgroup>
                          {goals && goals.length > 0 && (
                            <optgroup label="Goals (Direct Top-up)">
                              {goals.map((g: FinancialGoal) => (
                                <option key={g.id} value={g.id}>{g.name} - ₹{g.currentAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                      </div>
                      {accounts.find(a => a.id === formData.toAccountId)?.type === "debt" && (
                        <div className="pt-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Interest Portion (₹)</label>
                          <input 
                            type="number" 
                            value={formData.interestAmount}
                            onChange={(e) => setFormData({ ...formData, interestAmount: e.target.value })}
                            placeholder="0.00"
                            className="w-full p-3 mt-1 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                          />
                          <p className="text-[10px] text-slate-400 font-medium ml-1 mt-1">
                            Amount that goes to interest instead of principal balance. Leave empty for full top-up directly to balance.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Credit To Account</label>
                    <div className="relative">
                      <select 
                        value={formData.accountId}
                        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                        className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                      >
                        <option value="" disabled>Select an account</option>
                        {accounts.filter(a => ["bank", "cash", "card"].includes(a.type)).map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type.toUpperCase()}) - ₹{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                  <div className="relative">
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    >
                      <option value="uncategorized">Uncategorized</option>
                      {categories.map((c: Category) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{formData.isAutomated ? "Start Date" : "Date"}</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {formData.isAutomated && (
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-purple-100 bg-purple-50/50 dark:bg-purple-500/5 dark:border-purple-500/10">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-purple-700 dark:text-purple-400">Frequency</label>
                    <div className="relative">
                      <select 
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as TransactionFrequency })}
                        className="w-full p-3 pr-10 appearance-none bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-purple-700 dark:text-purple-400">Occurrences</label>
                    <input 
                      type="number" 
                      value={formData.recurringCount}
                      onChange={(e) => setFormData({ ...formData, recurringCount: e.target.value })}
                      placeholder="e.g. 12"
                      className="w-full p-3 bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleSave}
                className="w-full mt-4 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {transaction ? "Update Entry" : "Save Transaction"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
