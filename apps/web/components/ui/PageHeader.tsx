import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string; // Optional classes to append to the wrapper
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`sticky top-14 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 pt-1.5 pb-1.5 border-b border-slate-200 dark:border-white/5 mb-3 ${className}`}
    >
      <div className="flex flex-col flex-1 md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-4 shrink-0 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shrink-0"
              aria-label={backLabel || "Go back"}
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </Link>
          )}
          <div className="flex flex-col shrink-0 min-w-0">
            <h1 className="text-lg font-black text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            <p className="text-[9px] font-medium text-slate-500 truncate">
              {subtitle}
            </p>
          </div>
        </div>
        {actions && (
          <div className="flex items-center w-full md:w-auto min-w-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
