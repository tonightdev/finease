import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface STAccount {
  id: string;
  name: string;
  balance: number;
}

export interface STExpense {
  id: string;
  name: string;
  amount: number;
  accountId: string; // The account handling this expense
  isPaid: boolean;
}

export interface ShortTermPlan {
  id: string;
  name: string;
  createdAt: string;
  accounts: STAccount[];
  expenses: STExpense[];
}

export interface PlansState {
  items: ShortTermPlan[];
}

const initialState: PlansState = {
  items: [],
};

// Create a middleware-friendly slice that can be synced with localStorage in components
const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {
    setPlans(state, action: PayloadAction<ShortTermPlan[]>) {
      state.items = action.payload;
    },
    createPlan(state, action: PayloadAction<ShortTermPlan>) {
      state.items.push(action.payload);
    },
    updatePlan(state, action: PayloadAction<ShortTermPlan>) {
      const index = state.items.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deletePlan(state, action: PayloadAction<string>) {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
    // Account operations inside a specific plan
    addAccount(state, action: PayloadAction<{ planId: string; account: STAccount }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) plan.accounts.push(action.payload.account);
    },
    updateAccount(state, action: PayloadAction<{ planId: string; account: STAccount }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) {
        const accIdx = plan.accounts.findIndex(a => a.id === action.payload.account.id);
        if (accIdx !== -1) plan.accounts[accIdx] = action.payload.account;
      }
    },
    deleteAccount(state, action: PayloadAction<{ planId: string; accountId: string }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) {
        plan.accounts = plan.accounts.filter(a => a.id !== action.payload.accountId);
        plan.expenses = plan.expenses.map(e => e.accountId === action.payload.accountId ? { ...e, accountId: '' } : e);
      }
    },
    // Expense operations inside a specific plan
    addExpense(state, action: PayloadAction<{ planId: string; expense: STExpense }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) plan.expenses.push(action.payload.expense);
    },
    updateExpense(state, action: PayloadAction<{ planId: string; expense: STExpense }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) {
        const expIdx = plan.expenses.findIndex(e => e.id === action.payload.expense.id);
        if (expIdx !== -1) plan.expenses[expIdx] = action.payload.expense;
      }
    },
    deleteExpense(state, action: PayloadAction<{ planId: string; expenseId: string }>) {
      const plan = state.items.find(p => p.id === action.payload.planId);
      if (plan) {
        plan.expenses = plan.expenses.filter(e => e.id !== action.payload.expenseId);
      }
    },
  },
});

export const {
  setPlans,
  createPlan,
  updatePlan,
  deletePlan,
  addAccount,
  updateAccount,
  deleteAccount,
  addExpense,
  updateExpense,
  deleteExpense
} = plansSlice.actions;

export default plansSlice.reducer;
