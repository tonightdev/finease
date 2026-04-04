import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: ReactNode;
  headerAction?: ReactNode;
  onClick?: () => void;
}

export function Card({
  children,
  className,
  title,
  subtitle,
  headerAction,
  onClick,
}: CardProps) {
  return (
    <div 
      className={cn("finease-card p-3.5", className)}
      onClick={onClick}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-slate-900 dark:text-white font-bold text-lg tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <div className="text-slate-500 text-sm font-medium mt-0.5">
                {subtitle}
              </div>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
