"use client";

import { useRef, useCallback } from "react";
import { haptics } from "./haptics";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance in pixels required to trigger swipe
  triggerHaptic?: boolean;
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  triggerHaptic = true,
}: UseSwipeOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.targetTouches[0];
    if (!touch) return;
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Ensure horizontal gesture is dominant
    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      if (deltaX > 0) {
        // Swiped Left
        if (triggerHaptic) haptics.tick();
        onSwipeLeft?.();
      } else {
        // Swiped Right
        if (triggerHaptic) haptics.tick();
        onSwipeRight?.();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
      if (deltaY > 0) {
        // Swiped Up
        if (triggerHaptic) haptics.tick();
        onSwipeUp?.();
      } else {
        // Swiped Down
        if (triggerHaptic) haptics.tick();
        onSwipeDown?.();
      }
    }
  }, [
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    triggerHaptic,
  ]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
