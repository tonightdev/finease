import React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  noPadding = false,
}) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl w-full pb-32 space-y-4",
        !noPadding && "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
