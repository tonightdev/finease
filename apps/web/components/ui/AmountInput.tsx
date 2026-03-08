"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AmountInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  autoFocus,
}: AmountInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);


  // Prevent scroll change
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (document.activeElement === inputRef.current) {
        e.preventDefault();
      }
    };
    
    const input = inputRef.current;
    if (input) {
      input.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (input) {
        input.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  const formatWithCommas = (val: string) => {
    if (!val) return "";
    const parts = val.split(".");
    let lastThree = parts[0]!.substring(parts[0]!.length - 3);
    const otherNumbers = parts[0]!.substring(0, parts[0]!.length - 3);
    if (otherNumbers !== "") lastThree = "," + lastThree;
    parts[0] = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    return parts.join(".");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    if (/^-?\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  };


  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={formatWithCommas(value)}
      onChange={handleChange}
      onFocus={() => {}}
      onBlur={() => {}}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus={autoFocus}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
        }
      }}
      className={cn(
        "w-full h-10 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-3 text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}
