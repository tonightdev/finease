import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { BudgetSimulation, SimulationResult } from "@repo/types";

export interface SimulationState {
  current: BudgetSimulation | null;
  results: SimulationResult | null;
  loading: boolean;
  error: string | null;
}

const initialState: SimulationState = {
  current: {
    entries: []
  },
  results: null,
  loading: false,
  error: null,
};

export const fetchSimulation = createAsyncThunk(
  "simulation/fetch",
  async () => {
    // Simulated fetch
    return { entries: [] };
  }
);

export const startSimulation = createAsyncThunk(
  "simulation/start",
  async () => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple logic for the demo
    return {
      surplus: 1250,
      adherence: 85,
      efficiency: 92,
      suggestions: [
        "Reduce subscription overhead by 15%",
        "Allocate $200 more to high-yield savings",
        "Target dining out for optimization"
      ]
    };
  }
);

export const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    resetSimulation: (state) => {
      state.current = { entries: [] };
      state.results = null;
    },
    addEntry: (state, action: PayloadAction<BudgetSimulation["entries"][0]>) => {
      if (state.current) {
        state.current.entries.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSimulation.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSimulation.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(startSimulation.pending, (state) => {
        state.loading = true;
      })
      .addCase(startSimulation.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      });
  },
});

export const { resetSimulation, addEntry } = simulationSlice.actions;
export default simulationSlice.reducer;
