"use client";

import { useState, useEffect } from "react";
import { X, Building2, CreditCard, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Account } from "@repo/types";
import toast from "react-hot-toast";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: string; balance: string; minimumBalance?: string; maxLimit?: string }) => void;
  account?: Account | null;
}

export function AddAccountModal({ isOpen, onClose, onSave, account }: AddAccountModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    balance: "",
    minimumBalance: "",
    maxLimit: "",
  });

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
    } else {
      setTimeout(() => setFormData({ name: "", type: "bank", balance: "", minimumBalance: "", maxLimit: "" }), 300);
    }
  }, [account, isOpen]);

  const handleSave = () => {
    if (!formData.name) {
      toast.error("Please enter an account name");
      return;
    }
    if (!formData.balance) {
      toast.error("Please enter an initial balance");
      return;
    }
    onSave(formData);
    toast.success(account ? "Account updated successfully" : "Account added successfully");
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
                {account ? "Edit Account" : "Add Account"}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. HDFC Credit Card"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button 
                    disabled={!!account}
                    onClick={(e) => { e.preventDefault(); setFormData({ ...formData, type: "bank" }); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.type === "bank" ? "bg-primary border-primary text-white" : "bg-slate-50 dark:bg-[#0b0d12] border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary/50"}`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-bold">Bank</span>
                  </button>
                  <button 
                    disabled={!!account}
                    onClick={(e) => { e.preventDefault(); setFormData({ ...formData, type: "card" }); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.type === "card" ? "bg-primary border-primary text-white" : "bg-slate-50 dark:bg-[#0b0d12] border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary/50"}`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs font-bold">Card</span>
                  </button>
                  <button 
                    disabled={!!account}
                    onClick={(e) => { e.preventDefault(); setFormData({ ...formData, type: "cash" }); }}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.type === "cash" ? "bg-primary border-primary text-white" : "bg-slate-50 dark:bg-[#0b0d12] border-slate-200 dark:border-border-dark text-slate-500 dark:text-slate-400 hover:border-primary/50"}`}
                  >
                    <Wallet className="w-5 h-5" />
                    <span className="text-xs font-bold">Cash</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Initial Balance (₹)</label>
                <input 
                  type="number" 
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="0.00"
                  disabled={!!account}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                    account 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-border-dark/50" 
                      : "bg-slate-50 dark:bg-[#0b0d12] text-slate-900 dark:text-white border-slate-200 dark:border-border-dark"
                  }`}
                />
                {account && (
                  <p className="text-[10px] text-slate-400 uppercase font-bold ml-1 pt-1">
                    Initial balance cannot be edited manually once created. Use transactions to adjust.
                  </p>
                )}
              </div>

              {formData.type === "card" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-primary">Max Limit (₹)</label>
                  <input 
                    type="number" 
                    value={formData.maxLimit}
                    onChange={(e) => setFormData({ ...formData, maxLimit: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-orange-500">Minimum Balance (₹)</label>
                  <input 
                    type="number" 
                    value={formData.minimumBalance}
                    onChange={(e) => setFormData({ ...formData, minimumBalance: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <button 
                onClick={handleSave}
                className="w-full mt-4 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {account ? "Update Account" : "Create Account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
