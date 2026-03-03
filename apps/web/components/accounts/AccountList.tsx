"use client";

import { Account, AccountType } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { Building2, Wallet, Landmark, Pencil, Trash2, CreditCard } from "lucide-react";
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

  const getIcon = (type: string) => {
    switch (type) {
      case "bank": return <Landmark className="w-5 h-5" />;
      case "cash": return <Wallet className="w-5 h-5" />;
      case "debt": return <Building2 className="w-5 h-5" />;
      case "card": return <CreditCard className="w-5 h-5" />;
      case "investment": return <span className="material-symbols-outlined text-[20px]">trending_up</span>;
      default: return <Landmark className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bank": return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "cash": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "debt": return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case "card": return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";
      case "investment": return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      default: return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {accounts.map((account) => {
        const isLowBalance = (account.type === 'bank' || account.type === 'cash') && 
                            account.minimumBalance && account.minimumBalance > 0 && account.balance < account.minimumBalance;
        
        const usedAmount = account.type === 'card' ? Math.abs(account.balance) : 0;
        const isHighUsage = account.type === 'card' && account.maxLimit && account.maxLimit > 0 && 
                            (usedAmount / account.maxLimit) > 0.3;

        return (
          <Card key={account.id} className="p-2.5 hover:border-primary/50 transition-all group relative bg-white dark:bg-[#0b0d12] border-slate-200 dark:border-slate-800 shadow-none ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-primary/20">
            <div className="flex items-center justify-between gap-2">
              {/* Left: Icon + Info */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 ${getTypeColor(account.type)}`}>
                  {getIcon(account.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h4 className="text-slate-900 dark:text-white font-bold text-[11px] truncate leading-none">{account.name}</h4>
                    {isLowBalance && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" title="Low Balance" />
                    )}
                    {isHighUsage && (
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shrink-0" title="High Usage" />
                    )}
                  </div>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 leading-none">{account.type}</p>
                </div>
              </div>

              {/* Right: Balance + Details */}
              <div className="flex flex-col items-end shrink-0 transition-all group-hover:pr-12">
                <p className={`text-[13px] font-black tracking-tight leading-none ${isLowBalance || (account.type === 'card' && isHighUsage) ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(account.type === 'card' ? usedAmount : account.balance)}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  {account.minimumBalance && account.minimumBalance > 0 && (account.type === 'bank' || account.type === 'cash') ? (
                    <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-slate-400">
                      <span className="uppercase opacity-70">Min:</span>
                      <span className={isLowBalance ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}>
                        {formatCurrency(account.minimumBalance)}
                      </span>
                    </div>
                  ): null}
                  {account.maxLimit && account.maxLimit > 0 && account.type === 'card' ? (
                    <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-slate-400">
                      <span className="uppercase opacity-70">Limit:</span>
                      <span className={isHighUsage ? 'text-orange-500' : 'text-slate-600 dark:text-slate-400'}>
                        {formatCurrency(account.maxLimit)}
                      </span>
                    </div>
                  ): null}
                  {account.type === 'investment' && account.investedAmount && account.investedAmount > 0 ? (
                    <div className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-slate-400">
                      <span className="uppercase opacity-70">Inv:</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatCurrency(account.investedAmount)}</span>
                    </div>
                  ): null}
                </div>
              </div>
            </div>
            {/* Action Buttons Overlay */}
            <div className="absolute inset-y-0 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-0.5 bg-white/90 dark:bg-black/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 dark:border-slate-800 shadow-lg">
                <button 
                  onClick={() => { 
                    setEditingAccount(account); 
                    if (account.type === 'investment') {
                      setIsInvestmentModalOpen(true);
                    } else if (account.type === 'debt') {
                      setIsLiabilityModalOpen(true);
                    } else {
                      setIsAccountModalOpen(true);
                    } 
                  }}
                  className="p-1 text-slate-400 hover:text-primary transition-colors rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button 
                  onClick={() => {
                    setAccountToDelete(account);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}

      <AddAccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={editingAccount}
        onSave={(data) => {
          if (editingAccount) {
            dispatch(updateAccount({
              id: editingAccount.id,
              data: {
                name: data.name,
                type: data.type as AccountType,
                assetType: editingAccount.assetType || "",
                balance: parseFloat(data.balance) || 0,
                minimumBalance: parseFloat(data.minimumBalance || "0") || 0,
                maxLimit: parseFloat(data.maxLimit || "0") || 0,
              }
            }));
          }
          setIsAccountModalOpen(false);
        }}
      />
      
      <AddInvestmentModal 
        isOpen={isInvestmentModalOpen}
        onClose={() => setIsInvestmentModalOpen(false)}
        investment={editingAccount}
        onSave={(data) => {
          if (editingAccount) {
            dispatch(updateAccount({
              id: editingAccount.id,
              data: {
                name: data.assetName,
                assetType: data.assetType || editingAccount.assetType || "",
                investedAmount: parseFloat(data.investedAmount) || editingAccount.investedAmount || editingAccount.balance,
                balance: parseFloat(data.currentAmount) || editingAccount.balance
              }
            }));
          }
          setIsInvestmentModalOpen(false);
        }}
      />
      
      <AddLiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => setIsLiabilityModalOpen(false)}
        liability={editingAccount || undefined}
        onSave={(data) => {
          if (editingAccount) {
            const totalLoan = parseFloat(data.initialAmount) || 0;
            const paidAmt = parseFloat(data.paidAmount) || 0;
            const remainingBalance = totalLoan - paidAmt;
            
            dispatch(updateAccount({
              id: editingAccount.id,
              data: {
                name: data.name,
                type: data.type as "debt",
                initialAmount: totalLoan,
                paidAmount: paidAmt,
                balance: -remainingBalance
              }
            }));
          }
          setIsLiabilityModalOpen(false);
        }}
      />
    <ConfirmModal 
        isOpen={!!accountToDelete}
        title="Delete Account"
        message={`Are you sure you want to permanently delete "${accountToDelete?.name}"? All associated transactions will also be deleted. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => {
          if (accountToDelete) {
            dispatch(deleteAccount(accountToDelete.id));
            toast.success("Account deleted");
          }
          setAccountToDelete(null);
        }}
        onCancel={() => setAccountToDelete(null)}
      />
    </div>
  );
}
