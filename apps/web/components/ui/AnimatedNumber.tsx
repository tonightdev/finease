"use client";

import { useEffect } from "react";
import { useMotionValue, useSpring, useTransform, motion } from "framer-motion";

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
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });

  useEffect(() => {
    // Immediate set if it's the first render or if we want faster reaction
    motionValue.set(value);
  }, [value, motionValue]);

  const displayValue = useTransform(springValue, (latest) => {
    const rounded = latest.toFixed(precision);
    if (!format) return rounded;

    // Standard currency/number formatting
    return Number(rounded).toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
  });

  return (
    <span className={className}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
