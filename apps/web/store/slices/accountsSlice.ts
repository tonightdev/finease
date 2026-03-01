import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Account } from '@repo/types';

export interface AccountsState {
  items: Account[];
}

const initialState: AccountsState = {
  items: [],
};

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
      state.items.push(action.payload);
    },
    updateAccountBalance: (state, action: PayloadAction<{ id: string; amountChange: number; interestAmount?: number }>) => {
      state.items = state.items.map(acc => {
        if (acc.id === action.payload.id) {
          let actualChange = Number(action.payload.amountChange);
          let newPaidAmount = acc.paidAmount;
          let newInterestPaid = acc.interestPaid;

          // For CARD accounts, a "Credit" means spending money, which INCREASES the debt (negative balance).
          // But here, the input amountChange from the TransactionPage is usually positive for "Credits".
          // If we are CREDITING a card (spending), the balance should go MORE negative.
          // If we are DEBITING a card (paying it off), the balance should go toward 0 (positive change).
          if (acc.type === 'card') {
            actualChange = -actualChange;
          }

          if (acc.type === 'loan') {
             const interest = action.payload.interestAmount ? Number(action.payload.interestAmount) : 0;
             // If actualChange is positive, we are paying the loan.
             if (actualChange > 0) {
               actualChange = actualChange - interest;
               newInterestPaid = Number(acc.interestPaid || 0) + interest;
             } else {
               // Reverting a payment
               actualChange = actualChange + interest;
               newInterestPaid = Number(acc.interestPaid || 0) - interest;
             }
             newPaidAmount = Number(acc.paidAmount || 0) + actualChange;
          }

          const newBalance = Number(acc.balance) + actualChange;
          const newInvested = acc.type === 'investment' 
             ? Number(acc.investedAmount || acc.balance) + actualChange
             : acc.investedAmount;
             
          return { ...acc, balance: newBalance, investedAmount: newInvested, paidAmount: newPaidAmount, interestPaid: newInterestPaid };
        }
        return acc;
      });
    },
    updateAccount: (state, action: PayloadAction<Account>) => {
      const index = state.items.findIndex(acc => acc.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(acc => acc.id !== action.payload);
    }
  },
});

export const { addAccount, updateAccountBalance, updateAccount, removeAccount } = accountsSlice.actions;
export default accountsSlice.reducer;
