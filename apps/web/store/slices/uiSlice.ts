import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FinancialGoal, Expiry, Account, Transaction } from "@repo/types";

export interface UIState {
  modals: {
    isAccountModalOpen: boolean;
    isTransactionModalOpen: boolean;
    isGoalModalOpen: boolean;
    isExpiryModalOpen: boolean;
    isSimulationModalOpen: boolean;
  };
  selection: {
    selectedGoal: FinancialGoal | null;
    selectedExpiry: Expiry | null;
    selectedAccount: Account | null;
    selectedTransaction: Transaction | null;
  };
  commandPalette: {
    isOpen: boolean;
  };
}

const initialState: UIState = {
  modals: {
    isAccountModalOpen: false,
    isTransactionModalOpen: false,
    isGoalModalOpen: false,
    isExpiryModalOpen: false,
    isSimulationModalOpen: false,
  },
  selection: {
    selectedGoal: null,
    selectedExpiry: null,
    selectedAccount: null,
    selectedTransaction: null,
  },
  commandPalette: {
    isOpen: false,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<keyof UIState["modals"]>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState["modals"]>) => {
      state.modals[action.payload] = false;
    },
    toggleCommandPalette: (state) => {
      state.commandPalette.isOpen = !state.commandPalette.isOpen;
    },
    setCommandPalette: (state, action: PayloadAction<boolean>) => {
      state.commandPalette.isOpen = action.payload;
    },
    closeAllModals: (state) => {
      state.modals = initialState.modals;
      state.selection = initialState.selection;
    },
    setSelection: (state, action: PayloadAction<{ key: keyof UIState["selection"]; value: FinancialGoal | Expiry | Account | Transaction | null }>) => {
      // @ts-expect-error - indexing with dynamic key is expected for generic setter
      state.selection[action.payload.key] = action.payload.value;
    },
    clearSelection: (state) => {
      state.selection = initialState.selection;
    },
  },
});

export const {
  openModal,
  closeModal,
  toggleCommandPalette,
  setCommandPalette,
  closeAllModals,
  setSelection,
  clearSelection,
} = uiSlice.actions;

export default uiSlice.reducer;
