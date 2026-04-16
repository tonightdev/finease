"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
  subMessage?: string;
}

export function LoadingOverlay({ isOpen, message, subMessage }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-xl"
        >
          {/* Central Geometric Animation */}
          <div className="relative flex items-center justify-center mb-8">
            {/* Outer Rotating Square */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="size-16 border-2 border-primary/20 dark:border-primary/10 rounded-2xl"
            />
            {/* Inner Rotating Square (Counter-Clockwise) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute size-10 border-2 border-primary/40 dark:border-primary/30 rounded-xl"
            />
            {/* Central Pulse */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute size-3 bg-primary rounded-sm shadow-[0_0_15px_rgba(19,91,236,0.6)]"
            />
          </div>

          {/* Status Typography */}
          <div className="text-center space-y-2">
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] ml-[0.4em]"
            >
              {message || "Synchronizing Environment"}
            </motion.h3>
            {subMessage && (
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-[0.2em]"
              >
                {subMessage}
              </motion.p>
            )}
          </div>

          {/* Signature Ambience */}
          <div className="absolute bottom-12 flex items-center gap-1.5 opacity-50">
             {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, 12, 4],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                  className="w-0.5 bg-primary rounded-full"
                />
             ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
