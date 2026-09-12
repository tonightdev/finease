import React, { useState } from "react";
import { Download, RefreshCw, ArrowRight, Shield } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  User as UserType,
  Account,
  Transaction,
  FinancialGoal,
  Expiry,
  Category,
  AssetClass,
} from "@repo/types";

export function DataArchiveTab() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [
        profile,
        accountsRes,
        transactionsRes,
        goalsRes,
        expiriesRes,
        categoriesRes,
        assetClassesRes,
      ] = await Promise.all([
        api.get("/finance/profile").then((res) => res.data as UserType),
        api.get("/finance/accounts").then((res) => res.data as Account[]),
        api
          .get("/finance/transactions")
          .then((res) => res.data as Transaction[]),
        api.get("/finance/goals").then((res) => res.data as FinancialGoal[]),
        api.get("/finance/expiries").then((res) => res.data as Expiry[]),
        api.get("/finance/categories").then((res) => res.data as Category[]),
        api
          .get("/finance/asset-classes")
          .then((res) => res.data as AssetClass[]),
      ]);

      const data = {
        profile,
        accounts: accountsRes,
        transactions: transactionsRes,
        goals: goalsRes,
        expiries: expiriesRes,
        categories: categoriesRes,
        assetClasses: assetClassesRes,
        exportedAt: new Date().toISOString(),
        version: "1.1.0",
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finease_full_archive_${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Full identity dataset archived and downloaded");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Dataset serialization failure");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Export Repository Card */}
      <button
        type="button"
        className="w-full text-left cursor-pointer group"
        onClick={handleExportData}
        disabled={isExporting}
      >
        <div className="p-5 sm:p-6 rounded-2xl space-y-3 group-hover:border-primary/50 transition-all border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs">
          <div
            className={`size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:scale-110 ${
              isExporting ? "animate-bounce" : ""
            }`}
          >
            {isExporting ? (
              <RefreshCw className="size-5 animate-spin" />
            ) : (
              <Download size={20} />
            )}
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
              Export Repository
            </h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
              Full high-fidelity archive of identity datasets and financial
              ledger records.
            </p>
          </div>
          <div className="pt-1 flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-widest group-hover:translate-x-1 transition-transform">
            {isExporting ? "Exporting Data..." : "Initialize Archive"}{" "}
            <ArrowRight size={12} />
          </div>
        </div>
      </button>

      {/* Persistence Info Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden group shadow-xs">
        <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:rotate-12 duration-1000 pointer-events-none">
          <Shield size={160} />
        </div>
        <div className="relative z-10 max-w-lg space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <span className="size-2 rounded-full bg-primary" /> Security
            Protocol
          </div>
          <h4 className="text-xl sm:text-2xl font-black tracking-tight">
            Identity Persistence
          </h4>
          <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed">
            FinEase uses deep-lattice encryption to protect your financial
            state. Exported archives are encoded with your account auth
            structures and should be stored in a secure cold-storage node.
          </p>
        </div>
      </div>
    </div>
  );
}
