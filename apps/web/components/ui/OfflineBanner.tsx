"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOffline(!window.navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setShowReconnected(false);
    };

    let timer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        setShowReconnected(true);
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          setShowReconnected(false);
          setWasOffline(false);
        }, 3500);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [wasOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+10px)] left-1/2 -translate-x-1/2 z-[99999] max-w-sm w-[92%] sm:w-auto px-4 py-2 rounded-2xl bg-amber-500/90 text-white dark:bg-amber-600/95 backdrop-blur-md shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2.5 text-xs font-bold tracking-wide select-none pointer-events-none"
        >
          <WifiOff className="size-4 shrink-0 text-amber-100 animate-pulse" />
          <span>Offline Mode — Viewing cached wealth ledger</span>
        </motion.div>
      )}

      {showReconnected && !isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+10px)] left-1/2 -translate-x-1/2 z-[99999] max-w-sm w-[92%] sm:w-auto px-4 py-2 rounded-2xl bg-emerald-600/95 text-white backdrop-blur-md shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 text-xs font-bold tracking-wide select-none pointer-events-none"
        >
          <Wifi className="size-4 shrink-0 text-emerald-200" />
          <span>Back online — Real-time synchronization active</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
