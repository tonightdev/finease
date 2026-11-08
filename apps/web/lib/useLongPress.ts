"use client";

import { useRef, useCallback } from "react";
import { haptics } from "./haptics";

interface UseLongPressOptions {
  threshold?: number;
  triggerHaptic?: boolean;
}

export function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  { threshold = 450, triggerHaptic = true }: UseLongPressOptions = {},
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (triggerHaptic) haptics.impact();
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold, triggerHaptic]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPressRef.current && onClick) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: cancel,
  };
}
