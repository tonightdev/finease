"use client";

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

  const num =
    typeof value === "number" && !isNaN(value) ? value : Number(value) || 0;
  const formatted = format
    ? num.toLocaleString("en-IN", {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
    : num.toFixed(precision);

  return (
    <span data-balance="true" className={`cloaked-balance ${className || ""}`}>
      {prefix}
      <span>{formatted}</span>
      {suffix}
    </span>
  );
}
