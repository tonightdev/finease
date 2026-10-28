import React, { useState, useEffect } from "react";
import { Wallet, Database, Plus, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { RootState, AppDispatch } from "@/store";
import {
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/store/slices/accountsSlice";
import { Account, AccountType } from "@repo/types";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { formatCurrency } from "@/lib/utils";

export function AccountsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const bankAccounts = useSelector((state: RootState) => state.accounts.items);
  const bankAccountsLoading = useSelector(
    (state: RootState) => state.accounts.loading,
  );

  const [accountSubTab, setAccountSubTab] = useState<"active" | "closed">(
    "active",
  );
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<Account | null>(
    null,
  );

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const handleAccountAction = async (data: {
    name: string;
    type: string;
    balance: string;
    minimumBalance?: string;
    maxLimit?: string;
    excludeFromAnalytics?: boolean;
  }) => {
    try {
      if (editingBankAccount) {
        await dispatch(
          updateAccount({
            id: editingBankAccount.id,
            data: {
              ...data,
              type: data.type as AccountType,
              balance: parseFloat(data.balance) || 0,
              minimumBalance: data.minimumBalance
                ? parseFloat(data.minimumBalance)
                : undefined,
              maxLimit: data.maxLimit ? parseFloat(data.maxLimit) : undefined,
            },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createAccount({
            name: data.name,
            type: data.type as AccountType,
            assetType: "",
            balance: parseFloat(data.balance) || 0,
            minimumBalance: data.minimumBalance
              ? parseFloat(data.minimumBalance)
              : undefined,
            maxLimit: data.maxLimit ? parseFloat(data.maxLimit) : undefined,
            currency: "INR",
            excludeFromAnalytics: data.excludeFromAnalytics,
            isClosed: false,
          }),
        ).unwrap();
        setAccountSubTab("active");
      }
    } catch (error) {
      toast.error("Account synchronization failure");
      throw error;
    }
  };

  const toggleAccountStatus = async (account: Account) => {
    try {
      await dispatch(
        updateAccount({
          id: account.id,
          data: { isClosed: !account.isClosed },
        }),
      ).unwrap();
      toast.success(account.isClosed ? "Account reopened" : "Account closed");
    } catch {
      toast.error("Failed to update account status");
    }
  };

  const handleDeleteBankAccount = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this account? This action cannot be undone.",
      )
    )
      return;
    try {
      await dispatch(deleteAccount(id)).unwrap();
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const filteredAccounts = bankAccounts.filter(
    (acc) =>
      ["bank", "cash", "card"].includes(acc.type) &&
      (accountSubTab === "active" ? !acc.isClosed : acc.isClosed),
  );

  return (
    <>
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Controls Row: Sub-Tabs & Add Account Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAccountSubTab("active")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                accountSubTab === "active"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Active Accounts
            </button>
            <button
              type="button"
              onClick={() => setAccountSubTab("closed")}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                accountSubTab === "closed"
                  ? "bg-white dark:bg-slate-800 text-rose-500 shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Closed Accounts
            </button>
          </div>

          <Button
            onClick={() => {
              setEditingBankAccount(null);
              setIsAccountModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
          >
            <Plus size={14} /> Add Account
          </Button>
        </div>

        {/* Account Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bankAccountsLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))
          ) : filteredAccounts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
              <div className="size-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4 shadow-xs">
                {accountSubTab === "active" ? (
                  <Wallet className="size-8 text-primary/40" />
                ) : (
                  <Database className="size-8 text-slate-300 dark:text-white/20" />
                )}
              </div>
              <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5">
                {accountSubTab === "active"
                  ? "No active accounts found"
                  : "No closed accounts"}
              </h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                {accountSubTab === "active"
                  ? "Add a bank, card, or cash account to begin tracking."
                  : "Closed accounts will be saved here for your records."}
              </p>
            </div>
          ) : (
            filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 sm:p-5 rounded-2xl space-y-4 group hover:border-primary/50 transition-all bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-start justify-between relative z-10 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                      <Wallet size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {acc.name}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {acc.type.toUpperCase()} Account
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(acc.balance)}
                    </div>
                    <div className="text-[8px] font-black uppercase text-emerald-500 tracking-widest flex items-center justify-end gap-1">
                      <span className="size-1 rounded-full bg-emerald-500" />{" "}
                      Active
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBankAccount(acc);
                      setIsAccountModalOpen(true);
                    }}
                    className="flex-1 h-8 rounded-lg font-black text-[8px] uppercase tracking-widest border-slate-200 dark:border-white/10"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAccountStatus(acc)}
                    className={`flex-1 h-8 rounded-lg font-black text-[8px] uppercase tracking-widest border-slate-200 dark:border-white/10 ${
                      acc.isClosed
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-rose-500 hover:bg-rose-500/10"
                    }`}
                  >
                    {acc.isClosed ? "Re-open" : "Close"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBankAccount(acc.id)}
                    className="size-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 flex items-center justify-center shrink-0 cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingBankAccount(null);
        }}
        onSave={handleAccountAction}
        account={editingBankAccount}
      />
    </>
  );
}
