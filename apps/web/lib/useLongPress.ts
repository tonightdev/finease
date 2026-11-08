"use client";

import { useRef, useCallback } from "react";
import { haptics } from "./haptics";

interface UseLongPressOptions {
  threshold?: number;
  triggerHaptic?: boolean;
}

export function useLongPress(
  onLongPress: () => void,
  { threshold = 400, triggerHaptic = true }: UseLongPressOptions = {},
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isLongPressRef.current = false;
      const touch = e.touches[0];
      if (touch) {
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
      }
      clearTimer();
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (triggerHaptic) haptics.impact();
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold, triggerHaptic, clearTimer],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      // Cancel long press only if movement exceeds 10px jitter tolerance
      if (dx > 10 || dy > 10) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearTimer();
      if (isLongPressRef.current) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    },
    [clearTimer],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Only trigger for left-click
      isLongPressRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        if (triggerHaptic) haptics.impact();
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold, triggerHaptic, clearTimer],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      clearTimer();
      if (isLongPressRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [clearTimer],
  );

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Reset flag after preventing click
      setTimeout(() => {
        isLongPressRef.current = false;
      }, 50);
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: clearTimer,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: clearTimer,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
  };
}
