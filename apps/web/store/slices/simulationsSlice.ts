import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { Simulation } from "@repo/types";

export interface SimulationsState {
  items: Simulation[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: SimulationsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchSimulations = createAsyncThunk<
  Simulation[],
  { force?: boolean } | void
>(
  "simulations/fetchAll",
  async () => {
    const response = await api.get<Simulation[]>("/finance/simulations");
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const state = getState() as { simulations: SimulationsState };
      if (state.simulations.lastFetched !== null || state.simulations.loading) {
        return false;
      }
      return true;
    },
  }
);

export const createSimulationAction = createAsyncThunk(
  "simulations/create",
  async (plan: Partial<Simulation>) => {
    const response = await api.post<Simulation>("/finance/simulations", plan);
    return response.data;
  },
);

export const updateSimulationAction = createAsyncThunk(
  "simulations/update",
  async ({ id, data }: { id: string; data: Partial<Simulation> }) => {
    const response = await api.put<Simulation>(`/finance/simulations/${id}`, data);
    return response.data;
  },
);

export const deleteSimulationAction = createAsyncThunk(
  "simulations/delete",
  async ({ id, purge }: { id: string; purge?: boolean }) => {
    await api.delete(`/finance/simulations/${id}${purge ? "?hard=true" : ""}`);
    return id;
  },
);

export const simulationsSlice = createSlice({
  name: "simulations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSimulations.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSimulations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchSimulations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch simulations";
      })
      .addCase(createSimulationAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateSimulationAction.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteSimulationAction.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      });
  },
});

export default simulationsSlice.reducer;
