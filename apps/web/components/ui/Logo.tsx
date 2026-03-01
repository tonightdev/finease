import { Compass } from "lucide-react";

export function Logo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center shrink-0 ${className}`}>
      <Compass strokeWidth={2.5} className="w-full h-full text-primary" />
    </div>
  );
}
