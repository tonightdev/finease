"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

const EDGE_TRIGGER_WIDTH = 28; // px from screen left edge
const SWIPE_THRESHOLD = 60; // px required to execute back

const ROOT_PATHS = new Set(["/", "/dashboard", "/login", "/signup"]);

export function EdgeSwipeBack() {
  const router = useRouter();
  const pathname = usePathname();

  const [pullX, setPullX] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isTrackingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const canGoBack = Boolean(pathname && !ROOT_PATHS.has(pathname));

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!canGoBack) return;
      const touch = e.touches[0];
      if (!touch) return;

      // Only initiate if touch originates in the left edge zone
      if (touch.clientX <= EDGE_TRIGGER_WIDTH) {
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        isTrackingRef.current = true;
        hasTriggeredHapticRef.current = false;
      }
    },
    [canGoBack],
  );

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isTrackingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - startXRef.current;
    const deltaY = Math.abs(touch.clientY - startYRef.current);

    // Cancel if movement is predominantly vertical (scrolling)
    if (deltaY > 35 && deltaX < 20) {
      isTrackingRef.current = false;
      setIsActive(false);
      setPullX(0);
      return;
    }

    if (deltaX > 0) {
      const distance = Math.min(deltaX * 0.75, 96);
      setPullX(distance);
      setIsActive(true);

      if (distance >= SWIPE_THRESHOLD && !hasTriggeredHapticRef.current) {
        haptics.tick();
        hasTriggeredHapticRef.current = true;
      } else if (distance < SWIPE_THRESHOLD && hasTriggeredHapticRef.current) {
        hasTriggeredHapticRef.current = false;
      }
    } else {
      setPullX(0);
      setIsActive(false);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isTrackingRef.current) return;
    isTrackingRef.current = false;

    if (pullX >= SWIPE_THRESHOLD) {
      haptics.impact();
      setPullX(0);
      setIsActive(false);
      router.back();
    } else {
      setPullX(0);
      setIsActive(false);
    }
  }, [pullX, router]);

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!canGoBack) return null;

  const isPastThreshold = pullX >= SWIPE_THRESHOLD;

  return (
    <AnimatePresence>
      {isActive && pullX > 8 && (
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{
            opacity: Math.min(pullX / 40, 1),
            x: pullX - 44,
          }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: "spring", damping: 30, stiffness: 450 }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] pointer-events-none select-none flex items-center pl-2"
        >
          <div
            className={`size-11 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-xl border transition-all duration-150 ${
              isPastThreshold
                ? "bg-primary text-white border-primary shadow-primary/40 scale-110"
                : "bg-slate-900/85 text-slate-300 border-white/15 scale-95"
            }`}
          >
            <ChevronLeft
              className={`size-5 transition-transform duration-150 ${
                isPastThreshold ? "-translate-x-0.5" : ""
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
