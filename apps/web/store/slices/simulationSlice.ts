import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { BudgetSimulation, SimEntry } from "@repo/types";
import api from "@/lib/api";

export interface SimulationState {
  current: BudgetSimulation | null;
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: SimulationState = {
  current: {
    userId: "",
    basis: "monthly",
    entries: [],
    protocol: { needs: 50, wants: 30, savings: 20 },
  },
  loading: false,
  saveLoading: false,
  error: null,
  lastFetched: null,
};

export const fetchSimulation = createAsyncThunk<
  BudgetSimulation | null,
  { force?: boolean } | void
>("simulation/fetch", async () => {
  const response = await api.get<BudgetSimulation | null>("/finance/simulation");
  return response.data;
}, {
  condition: (arg, { getState }) => {
    if (arg?.force) return true;
    const state = getState() as { simulation: SimulationState };
    if (state.simulation.lastFetched !== null || state.simulation.loading) {
      return false;
    }
    return true;
  }
});

export const saveSimulation = createAsyncThunk(
  "simulation/save",
  async (data: Partial<BudgetSimulation>) => {
    const response = await api.post<BudgetSimulation>("/finance/simulation", data);
    return response.data;
  }
);

export const addSimEntry = createAsyncThunk(
  "simulation/addEntry",
  async (entry: SimEntry) => {
    const response = await api.post<BudgetSimulation>("/finance/simulation/entries", entry);
    return response.data;
  }
);

export const updateSimEntry = createAsyncThunk(
  "simulation/updateEntry",
  async ({ id, data }: { id: string; data: Partial<SimEntry> }) => {
    const response = await api.put<BudgetSimulation>(`/finance/simulation/entries/${id}`, data);
    return response.data;
  }
);

export const removeSimEntry = createAsyncThunk(
  "simulation/removeEntry",
  async (id: string) => {
    const response = await api.delete<BudgetSimulation>(`/finance/simulation/entries/${id}`);
    return response.data;
  }
);

export const simulationSlice = createSlice({
  name: "simulation",
  initialState,
  reducers: {
    resetSimulation: (state) => {
      state.current = { userId: "", entries: [], protocol: { needs: 50, wants: 30, savings: 20 } };
    },
    setSimulationProtocol: (state, action: PayloadAction<{ needs: number, wants: number, savings: number }>) => {
      if (state.current) {
         state.current.protocol = action.payload;
      }
    },
    setSimulationEntries: (state, action: PayloadAction<SimEntry[]>) => {
      if (state.current) {
        state.current.entries = action.payload;
      }
    },
    setSimulationBasis: (state, action: PayloadAction<"monthly" | "yearly">) => {
      if (state.current) {
        state.current.basis = action.payload;
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
        if (action.payload) {
          state.current = action.payload;
        }
        state.lastFetched = Date.now();
      })
      .addCase(fetchSimulation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch simulation";
      })
      .addCase(saveSimulation.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(saveSimulation.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.current = action.payload;
      })
      .addCase(addSimEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(updateSimEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(removeSimEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { resetSimulation, setSimulationProtocol, setSimulationEntries, setSimulationBasis } = simulationSlice.actions;
export default simulationSlice.reducer;
