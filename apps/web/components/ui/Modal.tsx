"use client";

import { useEffect, ReactNode, useRef } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Button } from "./Button";
import { haptics } from "@/lib/haptics";

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
  const dragControls = useDragControls();
  const hasTriggeredHapticRef = useRef(false);

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
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.7 }}
            onDrag={(_e, info) => {
              if (info.offset.y > 65 && !hasTriggeredHapticRef.current) {
                haptics.tick();
                hasTriggeredHapticRef.current = true;
              } else if (info.offset.y <= 65 && hasTriggeredHapticRef.current) {
                hasTriggeredHapticRef.current = false;
              }
            }}
            onDragEnd={(_e, info) => {
              hasTriggeredHapticRef.current = false;
              if (info.offset.y > 80 || info.velocity.y > 350) {
                haptics.impact();
                onClose();
              }
            }}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className={`relative w-full ${maxWidth} bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.35)] overflow-hidden ${maxHeight} flex flex-col my-auto ${className}`}
          >
            {/* Mobile Grab Handle Bar (Swipe Down to Dismiss Gesture) */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="w-full flex flex-col items-center justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing sm:hidden touch-none select-none shrink-0"
              aria-label="Swipe down to dismiss"
            >
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/30 transition-colors" />
            </div>

            {/* Header with Close Button and Drag Listener */}
            {title ? (
              <div
                onPointerDown={(e) => dragControls.start(e)}
                className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 touch-none select-none cursor-grab active:cursor-grabbing sm:cursor-default"
              >
                {typeof title === "string" ? (
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                ) : (
                  <div className="flex-1 pr-2">{title}</div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="absolute top-3.5 right-3.5 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                >
                  <X className="w-4 h-4" />
                </Button>
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
