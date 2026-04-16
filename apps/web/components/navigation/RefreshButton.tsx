"use client";

import * as React from "react";
import { RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useAnimation } from "framer-motion";
import toast from "react-hot-toast";

export function RefreshButton() {
  const router = useRouter();
  const controls = useAnimation();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    
    // Start the spinning animation
    await controls.start({
      rotate: 360,
      transition: { duration: 0.5, ease: "easeInOut" }
    });

    // Reset rotation for next click without animation
    controls.set({ rotate: 0 });

    try {
      // Refresh Next.js server fragments
      router.refresh();
      
      // Short delay to allow user to see the animation and for router.refresh to start
      // Then trigger a full reload to ensure Redux and other client states are reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh data");
      setIsRefreshing(false);
    }
  };

  return (
    <motion.button
      onClick={handleRefresh}
      className="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90 flex items-center justify-center group"
      aria-label="Refresh data"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div animate={controls}>
        <RotateCw 
          className={`h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors ${
            isRefreshing ? "opacity-50" : "opacity-100"
          }`} 
        />
      </motion.div>
      
      {/* Tooltip for desktop */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-white/10 hidden sm:block">
        Refresh Data
      </span>
    </motion.button>
  );
}
