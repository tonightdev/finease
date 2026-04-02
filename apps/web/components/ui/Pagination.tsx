"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalEntries: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalEntries,
  itemsPerPage,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);

  return (
    <div className={cn("flex items-center justify-between py-1 px-1", className)}>
      <div className="flex items-center gap-2.5">
        <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">
          Page {currentPage} / {totalPages}
        </p>
        <span className="hidden sm:inline w-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <p className="hidden sm:inline text-[9px] font-bold text-slate-500/50 uppercase tracking-widest">
          {startEntry}-{endEntry} <span className="lowercase">of</span> {totalEntries}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center size-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 disabled:opacity-20 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center size-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 disabled:opacity-20 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
