"use client";

import { useEffect, ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
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
  bodyClassName,
  footerClassName = "",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md">
          {/* Backdrop with tap-outside dismissal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className={`relative w-full ${maxWidth} bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden ${maxHeight} flex flex-col my-auto ${className}`}
          >
            {/* Header with Close Button */}
            {title ? (
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                {typeof title === "string" ? (
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                ) : (
                  <div className="flex-1 pr-2">{title}</div>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-slate-900 dark:hover:text-white" />
                </button>
              </div>
            ) : (
              <div className="absolute top-3.5 right-3.5 z-10">
                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                >
                  <X className="w-4 h-4 text-slate-500 hover:text-slate-900 dark:hover:text-white" />
                </button>
              </div>
            )}

            {/* Content Swiper / Scrollable Body */}
            <div
              className={`overflow-y-auto no-scrollbar flex-1 ${bodyClassName ?? "p-4"} ${!footer ? "pb-10 sm:pb-4" : ""}`}
            >
              {children}
            </div>

            {/* Optional Footer */}
            {footer && (
              <div
                className={`p-4 border-t border-slate-100 dark:border-border-dark bg-slate-50 dark:bg-slate-950/50 shrink-0 pb-10 sm:pb-4 ${footerClassName}`}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
