"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-md",
  maxHeight = "max-h-[92vh]",
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center p-4 sm:p-6 bg-slate-900/80">
          {/* Backdrop Click-to-Close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: "100%", scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: "100%", scale: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${maxWidth} bg-white dark:bg-surface-dark rounded-[2.5rem] border border-slate-200 dark:border-border-dark shadow-[0_20px_70px_rgba(0,0,0,0.4)] overflow-hidden ${maxHeight} flex flex-col ${className} mb-4 sm:mb-0`}
          >
            {/* Header */}
            {title && (
              <div className="p-4 border-b border-slate-100 dark:border-border-dark flex items-center justify-between shrink-0">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            )}

            {/* Content Swiper / Scrollable Body */}
            <div
              className={`p-4 overflow-y-auto flex-1 ${!footer ? "pb-10 sm:pb-4" : ""}`}
            >
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div className="p-4 border-t border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-slate-950/50 shrink-0 pb-10 sm:pb-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
