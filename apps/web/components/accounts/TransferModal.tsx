"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AmountInput } from "@/components/ui/AmountInput";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (
    amount: number,
    from: string,
    to: string,
  ) => Promise<void> | void;
}

export function TransferModal({
  isOpen,
  onClose,
  onTransfer,
}: TransferModalProps) {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const [amount, setAmount] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleTransfer = async () => {
    if (!amount || !fromAccount || !toAccount || fromAccount === toAccount)
      return;
    setIsSaving(true);
    try {
      await onTransfer(Number(amount), fromAccount, toAccount);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Withdrawal"
      footer={
        <Button
          onClick={handleTransfer}
          isLoading={isSaving}
          disabled={
            !amount || !fromAccount || !toAccount || fromAccount === toAccount
          }
          className="w-full"
        >
          Confirm Withdrawal
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 p-4 bg-slate-50 dark:bg-[#0b0d12] rounded-xl border border-slate-100 dark:border-border-dark">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              From
            </p>
            <select
              disabled={isSaving}
              className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-0 disabled:opacity-50"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <ArrowLeftRight className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 p-4 bg-slate-50 dark:bg-[#0b0d12] rounded-xl border border-slate-100 dark:border-border-dark">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
              To
            </p>
            <select
              disabled={isSaving}
              className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-0 disabled:opacity-50"
              value={toAccount}
              onChange={(e) => setToAccount(e.target.value)}
            >
              <option value="">Select Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
            Amount (₹)
          </label>
          <AmountInput
            value={amount}
            onChange={(val) => setAmount(val)}
            disabled={isSaving}
            placeholder="0.00"
            className="text-3xl h-auto py-4"
          />
        </div>
      </div>
    </Modal>
  );
}
