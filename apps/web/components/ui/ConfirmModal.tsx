import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden"
        >
          <div className="p-8 pb-6 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDestructive ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-4 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                isDestructive 
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                  : 'bg-primary hover:bg-primary-dark shadow-primary/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
