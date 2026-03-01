"use client";

import { Account } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Wallet, Landmark, Pencil, Trash2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { removeAccount, updateAccount } from "@/store/slices/accountsSlice";
import { AddAccountModal } from "./AddAccountModal";
import { AddInvestmentModal } from "../portfolio/AddInvestmentModal";
import { AddLiabilityModal } from "../portfolio/AddLiabilityModal";
import toast from "react-hot-toast";

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  const dispatch = useDispatch();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
  const [isLiabilityModalOpen, setIsLiabilityModalOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "bank": return <Landmark className="w-5 h-5" />;
      case "cash": return <Wallet className="w-5 h-5" />;
      case "loan": return <Building2 className="w-5 h-5" />;
      case "card": return <CreditCard className="w-5 h-5" />;
      case "investment": return <span className="material-symbols-outlined text-[20px]">trending_up</span>;
      default: return <Landmark className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bank": return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      case "cash": return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "loan": return "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400";
      case "card": return "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400";
      case "investment": return "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400";
      default: return "bg-slate-50 text-slate-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {accounts.map((account) => (
        <Card key={account.id} className="hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${getTypeColor(account.type)}`}>
              {getIcon(account.type)}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="capitalize">{account.type}</Badge>
              <button 
                onClick={() => { 
                  setEditingAccount(account); 
                  if (account.type === 'investment') {
                    setIsInvestmentModalOpen(true);
                  } else if (account.type === 'loan') {
                    setIsLiabilityModalOpen(true);
                  } else {
                    setIsAccountModalOpen(true);
                  } 
                }}
                className="text-slate-400 hover:text-primary transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  dispatch(removeAccount(account.id));
                  toast.success("Account deleted");
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-slate-900 dark:text-white font-bold">{account.name}</h4>
            {account.institutionName && (
              <p className="text-xs text-slate-500 font-medium">{account.institutionName}</p>
            )}
          </div>
          <div className="mt-6">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(account.balance)}
            </p>
            {account.type === 'investment' && (
              <p className="text-xs text-slate-500 font-bold mt-1">
                 Invested: {formatCurrency(account.investedAmount || account.balance)}
              </p>
            )}
            {account.type === 'loan' && account.initialAmount && (
              <p className="text-xs text-slate-500 font-bold mt-1">
                 Paid: {formatCurrency(account.paidAmount || 0)} / Total: {formatCurrency(account.initialAmount)}
              </p>
            )}
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 border-t border-slate-100 dark:border-slate-800 pt-2">
              Last synced {formatDate(account.lastSyncedAt)}
            </p>
          </div>
        </Card>
      ))}

      <AddAccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        account={editingAccount}
        onSave={(data) => {
          if (editingAccount) {
            dispatch(updateAccount({
              ...editingAccount,
              name: data.name,
              type: data.type as "bank" | "cash" | "loan" | "investment" | "card",
              assetType: editingAccount.assetType || "",
              balance: parseFloat(data.balance) || 0
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
              ...editingAccount,
              name: data.assetName,
              assetType: data.assetType || editingAccount.assetType || "",
              investedAmount: parseFloat(data.investedAmount) || editingAccount.investedAmount || editingAccount.balance,
              balance: parseFloat(data.currentAmount) || editingAccount.balance
            }));
          }
          setIsInvestmentModalOpen(false);
        }}
      />
      
      <AddLiabilityModal
        isOpen={isLiabilityModalOpen}
        onClose={() => setIsLiabilityModalOpen(false)}
        liability={editingAccount}
        onSave={(data) => {
          if (editingAccount) {
            const totalLoan = parseFloat(data.initialAmount) || 0;
            const paidAmt = parseFloat(data.paidAmount) || 0;
            const remainingBalance = totalLoan - paidAmt;
            
            dispatch(updateAccount({
              ...editingAccount,
              name: data.name,
              type: data.type as "loan",
              initialAmount: totalLoan,
              paidAmount: paidAmt,
              balance: -remainingBalance
            }));
          }
          setIsLiabilityModalOpen(false);
        }}
      />
    </div>
  );
}
