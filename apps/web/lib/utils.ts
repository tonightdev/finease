import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string | Date | number) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
export function calculateRunningBalances<
  T extends { date: string; amount: number; type: string },
>(transactions: T[]) {
  const chronological = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let runningBalance = 0;
  return chronological.map((t) => {
    const balanceBefore = runningBalance;
    const amount = t.type === "expense" ? -t.amount : t.amount;
    runningBalance += amount;
    return {
      ...t,
      balanceBefore,
      balanceAfter: runningBalance,
    };
  });
}

export function parseImportDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  const clean = dateStr.trim().replace(/\s+/g, " ");

  // 1. Handle common numeric formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmyMatch && dmyMatch[3]) {
    const day = parseInt(dmyMatch[1]!);
    const month = parseInt(dmyMatch[2]!) - 1;
    let year = parseInt(dmyMatch[3]!);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Handle formats with month names: DD-MMM-YYYY, DD MMM YYYY (e.g., 01-JAN-2024)
  const monthNames: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  const alphaMatch = clean.match(
    /^(\d{1,2})[-/.\x20]([A-Za-z]{3})[-/.\x20](\d{2,4})/,
  );
  if (alphaMatch && alphaMatch[3]) {
    const day = parseInt(alphaMatch[1]!);
    const month = monthNames[alphaMatch[2]!.toLowerCase().substring(0, 3)];
    let year = parseInt(alphaMatch[3]!);
    if (year < 100) year += 2000;
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // 3. Fallback to native constructor
  return new Date();
}

export function getHexFromTailwind(twClass: string): string {
  const map: Record<string, string> = {
    "bg-indigo-500": "#6366f1",
    "bg-orange-500": "#f97316",
    "bg-blue-500": "#3b82f6",
    "bg-pink-500": "#ec4899",
    "bg-emerald-500": "#10b981",
    "bg-purple-500": "#a855f7",
    "bg-rose-500": "#f43f5e",
    "bg-amber-500": "#f59e0b",
    "bg-slate-500": "#64748b",
  };
  return map[twClass] || twClass;
}
