import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { FinancialGoal } from "@repo/types";

export interface GoalsState {
  items: FinancialGoal[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: GoalsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchGoals = createAsyncThunk<
  FinancialGoal[],
  { force?: boolean } | void
>(
  "goals/fetchAll",
  async () => {
    const response = await api.get<FinancialGoal[]>("/finance/goals");
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const state = getState() as { goals: GoalsState };
      if (state.goals.lastFetched !== null || state.goals.loading) {
        return false;
      }
      return true;
    },
  }
);

export const addGoalAction = createAsyncThunk(
  "goals/add",
  async (goal: Partial<FinancialGoal>) => {
    const response = await api.post<FinancialGoal>("/finance/goals", goal);
    return response.data;
  },
);

export const updateGoalAction = createAsyncThunk(
  "goals/update",
  async ({ id, data }: { id: string; data: Partial<FinancialGoal> }) => {
    const response = await api.put<FinancialGoal>(`/finance/goals/${id}`, data);
    return response.data;
  },
);

export const deleteGoalAction = createAsyncThunk(
  "goals/delete",
  async ({ id, purge }: { id: string; purge?: boolean }) => {
    await api.delete(`/finance/goals/${id}${purge ? "?hard=true" : ""}`);
    return id;
  },
);

export const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch goals";
      })
      .addCase(addGoalAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateGoalAction.fulfilled, (state, action) => {
        const index = state.items.findIndex((g) => g.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteGoalAction.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g.id !== action.payload);
      });
  },
});

export default goalsSlice.reducer;
