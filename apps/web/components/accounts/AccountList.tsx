"use client";

import { Account, AccountType } from "@repo/types";
import { Card } from "@/components/ui/Card";
import {
  Building2,
  Wallet,
  Landmark,
  Pencil,
  Trash2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { deleteAccount, updateAccount } from "@/store/slices/accountsSlice";
import { AddAccountModal } from "./AddAccountModal";
import { AddInvestmentModal } from "@/components/portfolio/AddInvestmentModal";
import { AddLiabilityModal } from "@/components/portfolio/AddLiabilityModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMore = accounts.length > 4;

  const getIcon = (type: string) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-4 h-4" />;
      case "cash":
        return <Wallet className="w-4 h-4" />;
      case "debt":
        return <Building2 className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      case "investment":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Landmark className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bank":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "cash":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "debt":
        return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case "card":
        return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";
      case "investment":
        return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
        {accounts.map((account, index) => {
        const isLowBalance =
          (account.type === "bank" || account.type === "cash") &&
          account.minimumBalance &&
          account.minimumBalance > 0 &&
          account.balance < account.minimumBalance;

        const usedAmount =
          account.type === "card" ? Math.abs(account.balance) : 0;
        const isHighUsage =
          account.type === "card" &&
          account.maxLimit &&
          account.maxLimit > 0 &&
          usedAmount / account.maxLimit > 0.3;

          return (
            <Card
              key={account.id}
              className={`p-2.5 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm rounded-2xl active:scale-[0.98] transition-all flex flex-col gap-2 ${index >= 4 && !isExpanded ? "hidden lg:flex" : "flex"}`}
            >
            <div className="flex items-start justify-between">
              <div
                className={`p-1.5 rounded-lg shrink-0 ${getTypeColor(account.type)}`}
              >
                {getIcon(account.type)}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAccount(account);
                    if (account.type === "investment")
                      setIsInvestmentModalOpen(true);
                    else if (account.type === "debt")
                      setIsLiabilityModalOpen(true);
                    else setIsAccountModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAccountToDelete(account);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <h4 className="text-slate-400 dark:text-slate-500 font-bold text-[8px] uppercase tracking-widest truncate mb-0.5">
                {account.name}
              </h4>
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={`text-sm font-black tracking-tighter truncate ${account.type === "card" && usedAmount > 0 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}
                >
                  {account.type === "card" && usedAmount > 0 ? "-" : ""}₹
                  {(account.type === "card"
                    ? usedAmount
                    : account.balance
                  ).toLocaleString()}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {account.type === "card"
                      ? "Limit"
                      : account.type === "investment"
                        ? "Basis"
                        : account.type === "bank"
                          ? "Min Bal"
                          : "Type"}
                  </span>
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">
                    {account.type === "card"
                      ? `₹${(account.maxLimit || 0).toLocaleString()}`
                      : account.type === "investment"
                        ? `₹${(account.investedAmount || account.balance).toLocaleString()}`
                        : account.type === "bank"
                          ? `₹${(account.minimumBalance || 0).toLocaleString()}`
                          : account.type}
                  </span>
                  {(isLowBalance || isHighUsage) && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLowBalance ? "bg-rose-500" : "bg-amber-500"} animate-pulse`}
                    />
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
      </div>

      {hasMore && (
        <div className="flex justify-center lg:hidden pb-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all border border-slate-200/50 dark:border-white/5 active:scale-95 shadow-sm"
          >
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em]">
              {isExpanded ? "Show Less" : "Show More"}
            </span>
          </button>
        </div>
      )}

      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={editingAccount}
        onSave={async (data) => {
          if (editingAccount) {
            await dispatch(
              updateAccount({
                id: editingAccount.id,
                data: {
                  name: data.name,
                  type: data.type as AccountType,
                  assetType: editingAccount.assetType || "",
                  balance: parseFloat(data.balance) || 0,
                  minimumBalance: parseFloat(data.minimumBalance || "0") || 0,
                  maxLimit: parseFloat(data.maxLimit || "0") || 0,
                },
              }),
            ).unwrap();
          }
        }}
      />

      <AddInvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        investment={editingAccount}
        onSave={async (data) => {
          if (editingAccount) {
            await dispatch(
              updateAccount({
                id: editingAccount.id,
                data: {
                  name: data.assetName,
                  assetType: data.assetType || editingAccount.assetType || "",
                  investedAmount:
                    parseFloat(data.investedAmount) ||
                    editingAccount.investedAmount ||
                    editingAccount.balance,
                  balance:
                    parseFloat(data.currentAmount) || editingAccount.balance,
                },
              }),
            ).unwrap();
          }
        }}
      />

      <AddLiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => setIsLiabilityModalOpen(false)}
        liability={editingAccount || undefined}
        onSave={async (data) => {
          if (editingAccount) {
            const totalLoan = parseFloat(data.initialAmount) || 0;
            const paidAmt = parseFloat(data.paidAmount) || 0;
            const remainingBalance = totalLoan - paidAmt;

            await dispatch(
              updateAccount({
                id: editingAccount.id,
                data: {
                  name: data.name,
                  type: data.type as "debt",
                  initialAmount: totalLoan,
                  paidAmount: paidAmt,
                  balance: -remainingBalance,
                },
              }),
            ).unwrap();
          }
        }}
      />

      <ConfirmModal
        isOpen={!!accountToDelete}
        title="Delete Account"
        message={`Are you sure you want to permanently delete "${accountToDelete?.name}"? All associated transactions will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={async () => {
          if (accountToDelete) {
            await dispatch(deleteAccount(accountToDelete.id)).unwrap();
            toast.success("Account deleted");
            setAccountToDelete(null);
          }
        }}
        onCancel={() => setAccountToDelete(null)}
      />
    </div>
  );
}
