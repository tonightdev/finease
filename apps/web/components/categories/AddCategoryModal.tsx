import { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; color: string; parentType?: string }) => void;
  onDelete?: (id: string) => void;
  category?: { id: string; name: string; color: string; parentType?: string } | null;
}

export function AddCategoryModal({ isOpen, onClose, onSave, onDelete, category }: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("bg-indigo-500");
  const [parentType, setParentType] = useState("needs");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setParentType(category.parentType || "needs");
    } else {
      setName("");
      setColor("bg-indigo-500");
      setParentType("needs");
    }
  }, [category, isOpen]);

  const colors = [
    "bg-indigo-500",
    "bg-orange-500",
    "bg-blue-500",
    "bg-pink-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-amber-500"
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <div className="px-8 pt-8 pb-4 flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {category ? "Modify" : "New"} <span className="text-primary">Category</span>
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-8 pt-4 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Linguistic Label</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Subscriptions"
                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Parent Hierarchy</label>
              <div className="relative">
                <select 
                  value={parentType}
                  onChange={(e) => setParentType(e.target.value)}
                  className="w-full p-4 pr-10 appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-bold text-slate-900 dark:text-white"
                >
                  <option value="needs">Needs</option>
                  <option value="wants">Wants</option>
                  <option value="savings">Savings</option>
                  <option value="income">Income</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Visual Signature</label>
              <div className="flex flex-wrap gap-4 mt-2">
                {colors.map(c => (
                  <button 
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-2xl ${c} ${color === c ? 'ring-4 ring-offset-4 ring-primary dark:ring-offset-slate-900 scale-110 shadow-lg shadow-primary/20' : 'hover:scale-105 transition-all opacity-80 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <button 
                onClick={() => {
                  if(name.trim()) {
                    onSave({ id: category?.id, name, color, parentType });
                    setName("");
                    setColor("bg-indigo-500");
                    setParentType("needs");
                  }
                }}
                className="w-full py-5 bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
              >
                {category ? "Commit Changes" : "Create Entity"}
              </button>
              
              {category && onDelete && (
                <button 
                  onClick={() => onDelete(category.id)}
                  className="w-full py-4 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
                >
                  Purge Category
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
