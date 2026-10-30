import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: ReactNode | string;
  subtitle: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bordered?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  children,
  className = "",
  bordered = false,
}: PageHeaderProps) {
  return (
    <div
      className={`w-full pt-1 pb-2 sm:pb-3 ${bordered ? "border-b border-slate-200 dark:border-white/5 mb-3" : "mb-1.5"} ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {backHref && (
            <Link
              href={backHref}
              className="size-9 sm:size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shrink-0 flex items-center justify-center active:scale-95 touch-manipulation shadow-xs"
              aria-label={backLabel || "Go back"}
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Link>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h1>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
        {actions && (
          <div className="flex items-center w-full md:w-auto min-w-0 md:shrink-0 empty:hidden">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
