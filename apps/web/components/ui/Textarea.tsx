/* eslint-disable react/prop-types */
import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[70px] w-full rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium ring-offset-white placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-500 dark:focus-visible:ring-primary transition-all",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
