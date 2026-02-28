"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GoalFormData {
  name: string;
  targetAmount: number;
  targetDate: string;
}

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalId: string | null, data: GoalFormData) => void;
  editingGoal?: {
    id: string;
    name: string;
    targetAmount: number;
    targetDate: string;
  } | null;
}

export function EditGoalModal({ isOpen, onClose, onSave, editingGoal }: EditGoalModalProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    targetAmount: 0,
    targetDate: "",
  });

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount,
        targetDate: editingGoal.targetDate,
      });
    } else {
      setFormData({ name: "", targetAmount: 0, targetDate: "" });
    }
  }, [editingGoal, isOpen]);

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
                {editingGoal ? "Edit Goal" : "Add Goal"}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Goal Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dream Home"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Target Amount (₹)</label>
                <input 
                  type="number" 
                  value={formData.targetAmount || ""}
                  onChange={(e) => setFormData({ ...formData, targetAmount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Target Date</label>
                <input 
                  type="date" 
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <button 
                onClick={() => onSave(editingGoal?.id || null, formData)}
                className="w-full mt-4 py-4 bg-primary hover:bg-primary-dark text-white font-black rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
              >
                {editingGoal ? "Save Goals" : "Create Goal"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
