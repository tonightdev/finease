import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FinancialGoal, Expiry, Account, Transaction } from "@repo/types";

export interface UIState {
  modals: {
    isAccountModalOpen: boolean;
    isTransactionModalOpen: boolean;
    isGoalModalOpen: boolean;
    isExpiryModalOpen: boolean;
    isSimulationModalOpen: boolean;
    isWealthPulseOpen: boolean;
    isTrajectoryHistoryOpen: boolean;
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
  ghostMode: boolean;
}

const isClient = typeof window !== "undefined";
const savedGhostMode = isClient
  ? localStorage.getItem("finease_ghost_mode") === "true"
  : false;

const initialState: UIState = {
  modals: {
    isAccountModalOpen: false,
    isTransactionModalOpen: false,
    isGoalModalOpen: false,
    isExpiryModalOpen: false,
    isSimulationModalOpen: false,
    isWealthPulseOpen: false,
    isTrajectoryHistoryOpen: false,
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
  ghostMode: savedGhostMode,
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
    toggleGhostMode: (state) => {
      state.ghostMode = !state.ghostMode;
      if (typeof window !== "undefined") {
        localStorage.setItem("finease_ghost_mode", String(state.ghostMode));
      }
    },
    setGhostMode: (state, action: PayloadAction<boolean>) => {
      state.ghostMode = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("finease_ghost_mode", String(state.ghostMode));
      }
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
    setSelection: (
      state,
      action: PayloadAction<{
        key: keyof UIState["selection"];
        value: FinancialGoal | Expiry | Account | Transaction | null;
      }>,
    ) => {
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
  toggleGhostMode,
  setGhostMode,
  toggleCommandPalette,
  setCommandPalette,
  closeAllModals,
  setSelection,
  clearSelection,
} = uiSlice.actions;

export default uiSlice.reducer;
