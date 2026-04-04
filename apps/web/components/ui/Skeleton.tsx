interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-800 rounded-md ${className}`}
    />
  );
}
