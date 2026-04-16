import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  modals: {
    isAccountModalOpen: boolean;
    isTransactionModalOpen: boolean;
    isGoalModalOpen: boolean;
    isExpiryModalOpen: boolean;
    isSimulationModalOpen: boolean;
  };
  selection: {
    selectedGoal: any | null;
    selectedExpiry: any | null;
    selectedAccount: any | null;
    selectedTransaction: any | null;
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
    setSelection: (state, action: PayloadAction<{ key: keyof UIState["selection"]; value: any }>) => {
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
