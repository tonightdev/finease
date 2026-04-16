import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { BudgetStrategy, StrategyEntry } from "@repo/types";
import api from "@/lib/api";

export interface StrategyState {
  current: BudgetStrategy | null;
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: StrategyState = {
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

export const fetchStrategy = createAsyncThunk<
  BudgetStrategy | null,
  { force?: boolean } | void
>("strategies/fetch", async () => {
  const response = await api.get<BudgetStrategy | null>("/finance/strategy");
  return response.data;
}, {
  condition: (arg, { getState }) => {
    if (arg?.force) return true;
    const state = getState() as { strategies: StrategyState };
    if (state.strategies.lastFetched !== null || state.strategies.loading) {
      return false;
    }
    return true;
  }
});

export const saveStrategy = createAsyncThunk(
  "strategies/save",
  async (data: Partial<BudgetStrategy>) => {
    const response = await api.post<BudgetStrategy>("/finance/strategy", data);
    return response.data;
  }
);

export const addStrategyEntry = createAsyncThunk(
  "strategies/addEntry",
  async (entry: StrategyEntry) => {
    const response = await api.post<BudgetStrategy>("/finance/strategy/entries", entry);
    return response.data;
  }
);

export const updateStrategyEntry = createAsyncThunk(
  "strategies/updateEntry",
  async ({ id, data }: { id: string; data: Partial<StrategyEntry> }) => {
    const response = await api.put<BudgetStrategy>(`/finance/strategy/entries/${id}`, data);
    return response.data;
  }
);

export const removeStrategyEntry = createAsyncThunk(
  "strategies/removeEntry",
  async (id: string) => {
    const response = await api.delete<BudgetStrategy>(`/finance/strategy/entries/${id}`);
    return response.data;
  }
);

export const strategiesSlice = createSlice({
  name: "strategies",
  initialState,
  reducers: {
    resetStrategy: (state) => {
      state.current = { userId: "", entries: [], protocol: { needs: 50, wants: 30, savings: 20 } };
    },
    setStrategyProtocol: (state, action: PayloadAction<{ needs: number, wants: number, savings: number }>) => {
      if (state.current) {
         state.current.protocol = action.payload;
      }
    },
    setStrategyEntries: (state, action: PayloadAction<StrategyEntry[]>) => {
      if (state.current) {
        state.current.entries = action.payload;
      }
    },
    setStrategyBasis: (state, action: PayloadAction<"monthly" | "yearly">) => {
      if (state.current) {
        state.current.basis = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStrategy.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStrategy.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.current = action.payload;
        }
        state.lastFetched = Date.now();
      })
      .addCase(fetchStrategy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch strategy";
      })
      .addCase(saveStrategy.pending, (state) => {
        state.saveLoading = true;
      })
      .addCase(saveStrategy.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.current = action.payload;
      })
      .addCase(addStrategyEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(updateStrategyEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(removeStrategyEntry.fulfilled, (state, action) => {
        state.current = action.payload;
      });
  },
});

export const { resetStrategy, setStrategyProtocol, setStrategyEntries, setStrategyBasis } = strategiesSlice.actions;
export default strategiesSlice.reducer;
