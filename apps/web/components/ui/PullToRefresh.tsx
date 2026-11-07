"use client";

import React, { useState, useRef, useCallback } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { haptics } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 64;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const hasTriggeredHapticRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startYRef.current = e.touches[0]?.clientY || 0;
        isPullingRef.current = true;
        hasTriggeredHapticRef.current = false;
      }
    },
    [isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      const currentY = e.touches[0]?.clientY || 0;
      const diff = currentY - startYRef.current;

      if (diff > 0 && window.scrollY === 0) {
        // Apply elastic rubber-band resistance
        const distance = Math.min(diff * 0.4, 88);
        setPullY(distance);

        if (distance >= PULL_THRESHOLD && !hasTriggeredHapticRef.current) {
          haptics.tick();
          hasTriggeredHapticRef.current = true;
        } else if (distance < PULL_THRESHOLD && hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        setPullY(0);
      }
    },
    [isRefreshing],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (pullY >= PULL_THRESHOLD && !isRefreshing) {
      haptics.impact();
      setIsRefreshing(true);
      setPullY(48); // lock height while refreshing

      try {
        await onRefresh();
        haptics.success();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
        }, 350);
      }
    } else {
      setPullY(0);
    }
  }, [pullY, isRefreshing, onRefresh]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex flex-col flex-1"
    >
      {/* Pull Indicator Drawer */}
      <div
        className="overflow-hidden flex items-center justify-center transition-all duration-200 pointer-events-none select-none"
        style={{
          height: `${pullY}px`,
          opacity: pullY > 10 ? Math.min(pullY / PULL_THRESHOLD, 1) : 0,
        }}
      >
        <div className="size-9 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center text-primary">
          {isRefreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowDown
              className="size-4 transition-transform duration-200"
              style={{
                transform:
                  pullY >= PULL_THRESHOLD ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
