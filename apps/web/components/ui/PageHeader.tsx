import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string; // Optional classes to append to the wrapper
}

export function PageHeader({ title, subtitle, actions, children, className = "" }: PageHeaderProps) {
  return (
    <div className={`sticky top-16 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md -mx-4 px-4 pt-4 pb-2 border-b border-slate-200 dark:border-white/5 ${className}`}>
      <div className="flex flex-col flex-1 md:flex-row md:items-center justify-between gap-2">
        <div className="flex flex-col shrink-0 min-w-0">
          <h1 className="text-lg font-black text-slate-900 dark:text-white truncate">{title}</h1>
          <p className="text-[9px] font-medium text-slate-500 truncate">{subtitle}</p>
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
