"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Account } from "@repo/types";
import toast from "react-hot-toast";

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { assetName: string; assetType: string; investedAmount: string; currentAmount: string }) => void;
  investment?: Account | null;
}

export function AddInvestmentModal({ isOpen, onClose, onSave, investment }: AddInvestmentModalProps) {
  const assetTypes = useSelector((state: RootState) => state.assetClasses.items);
  const [formData, setFormData] = useState({
    assetName: "",
    assetType: assetTypes[0]?.id || "",
    investedAmount: "",
    currentAmount: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (investment) {
        setFormData({
          assetName: investment.name,
          assetType: investment.assetType || assetTypes[0]?.id || "",
          investedAmount: String(investment.investedAmount || investment.balance),
          currentAmount: String(investment.balance),
        });
      } else {
        setFormData({
          assetName: "",
          assetType: assetTypes.length > 0 ? (assetTypes[0]?.id || "") : "",
          investedAmount: "",
          currentAmount: "",
        });
      }
    } else {
      setTimeout(() => setFormData({ assetName: "", assetType: assetTypes[0]?.id || "", investedAmount: "", currentAmount: "" }), 300);
    }
  }, [investment, isOpen, assetTypes]);

  const handleSave = () => {
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
    onSave(formData);
    toast.success(investment ? "Investment updated successfully" : "Investment logged successfully");
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
                 {investment ? "Edit Investment" : "Add Investment"}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Asset Name / Ticker</label>
                <input 
                  type="text" 
                  value={formData.assetName}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                  placeholder="e.g. NIFTY 50 Index"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Asset Class</label>
                <div className="relative">
                  <select 
                    value={formData.assetType}
                    onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
                    className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  >
                    <option value="" disabled>Select Asset Class</option>
                    {assetTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Capital Invested (₹)</label>
                <input 
                  type="number" 
                  value={formData.investedAmount}
                  onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                  placeholder="0.00"
                  disabled={!!investment}
                  className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none ${
                    investment 
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-border-dark/50" 
                      : "bg-slate-50 dark:bg-[#0b0d12] text-slate-900 dark:text-white border-slate-200 dark:border-border-dark"
                  }`}
                />
                {investment && (
                   <p className="text-[10px] text-slate-400 uppercase font-bold ml-1 pt-1">
                     Capital Invested cannot be edited manually once created. Use transactions to adjust.
                   </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Current Value (₹)</label>
                <input 
                  type="number" 
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <button 
                onClick={handleSave}
                className="w-full mt-4 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {investment ? "Update Investment" : "Log Investment"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
