"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  format?: boolean;
}

export function AnimatedNumber({
  value,
  className,
  prefix = "",
  suffix = "",
  precision = 0,
  format = true,
}: AnimatedNumberProps) {
  const ghostMode = useSelector((state: RootState) => state.ui.ghostMode);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const displayValue = useTransform(springValue, (latest) => {
    const rounded = latest.toFixed(precision);
    if (!format) return rounded;

    return Number(rounded).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  });

  if (ghostMode) {
    return (
      <span
        data-balance="true"
        className={`cloaked-balance select-none ${className || ""}`}
      >
        *****
      </span>
    );
  }

  return (
    <span data-balance="true" className={`cloaked-balance ${className || ""}`}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
