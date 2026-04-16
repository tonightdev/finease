"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { closeModal } from "@/store/slices/uiSlice";
import { createAccount } from "@/store/slices/accountsSlice";
import { createTransaction } from "@/store/slices/transactionsSlice";
import { addGoalAction } from "@/store/slices/goalsSlice";
import { createExpiryAction } from "@/store/slices/expiriesSlice";

// Import Modals
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { AddExpiryModal } from "@/components/expiries/AddExpiryModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { AccountType } from "@repo/types";

export function GlobalModals() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const modals = useSelector((state: RootState) => state.ui.modals);
  const selection = useSelector((state: RootState) => state.ui.selection);

  if (!user) return null;

  return (
    <>
      {/* Global Add Account Modal */}
      <AddAccountModal
        isOpen={modals.isAccountModalOpen}
        onClose={() => dispatch(closeModal("isAccountModalOpen"))}
        onSave={async (data) => {
          await dispatch(
            createAccount({
              name: data.name,
              type: data.type as AccountType,
              assetType: "",
              balance: parseFloat(data.balance) || 0,
              minimumBalance: parseFloat(data.minimumBalance || "0") || 0,
              maxLimit: parseFloat(data.maxLimit || "0") || 0,
              currency: "INR",
              excludeFromAnalytics: data.excludeFromAnalytics,
            }),
          ).unwrap();
        }}
      />

      <TransactionModal
        isOpen={modals.isTransactionModalOpen}
        onClose={() => dispatch(closeModal("isTransactionModalOpen"))}
        onSave={async (data) => {
          await dispatch(createTransaction(data)).unwrap();
        }}
        transaction={selection.selectedTransaction}
      />

      {/* Global Goal Modal */}
      <EditGoalModal
        isOpen={modals.isGoalModalOpen}
        onClose={() => dispatch(closeModal("isGoalModalOpen"))}
        editingGoal={selection.selectedGoal}
        onSave={async (id, data) => {
          if (id) {
             // update logic handled by slice usually, but we keep it here for parity
          } else {
            await dispatch(addGoalAction({
              userId: user.uid,
              ...data,
              currentAmount: 0,
              startDate: new Date().toISOString(),
              category: "General",
            })).unwrap();
          }
        }}
      />

      {/* Global Expiry Modal */}
      <AddExpiryModal
        isOpen={modals.isExpiryModalOpen}
        onClose={() => dispatch(closeModal("isExpiryModalOpen"))}
        onSave={async (data) => {
          await dispatch(createExpiryAction(data)).unwrap();
        }}
        expiry={selection.selectedExpiry}
      />
    </>
  );
}
