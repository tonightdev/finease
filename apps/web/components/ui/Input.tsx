/* eslint-disable react/prop-types */
import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputMode, pattern, onWheel, ...props }, ref) => {
    const testStr = `${props.name || ""} ${props.id || ""} ${props.placeholder || ""}`;
    const isInteger =
      /(day|date|count|pin|pinCode|monthStartDate|dueDay|targetDay|notice)/i.test(
        testStr,
      );

    const isNumericField =
      type === "number" ||
      type === "tel" ||
      /(amount|balance|price|rate|limit|target|debt|interest|pin|day|count|cost|val|shares|percent|fee|tax|due)/i.test(
        testStr,
      );

    const effectiveInputMode =
      inputMode ||
      (isInteger ? "numeric" : isNumericField ? "decimal" : undefined);

    const effectivePattern = pattern || (isNumericField ? "[0-9]*" : undefined);

    return (
      <input
        type={type}
        inputMode={effectiveInputMode}
        pattern={effectivePattern}
        onWheel={(e) => {
          if (type === "number") {
            (e.target as HTMLElement).blur();
          }
          onWheel?.(e);
        }}
        className={cn(
          "flex h-9 sm:h-10 w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ring-offset-white file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-500 dark:focus-visible:ring-primary font-bold transition-all",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
