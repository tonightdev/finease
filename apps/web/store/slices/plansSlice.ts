import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { ShortTermPlan } from "@repo/types";

export interface PlansState {
  items: ShortTermPlan[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: PlansState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchPlans = createAsyncThunk<
  ShortTermPlan[],
  { force?: boolean } | void
>(
  "plans/fetchAll",
  async () => {
    const response = await api.get<ShortTermPlan[]>("/finance/plans");
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const state = getState() as { plans: PlansState };
      if (state.plans.lastFetched !== null || state.plans.loading) {
        return false;
      }
      return true;
    },
  }
);

export const createPlanAction = createAsyncThunk(
  "plans/create",
  async (plan: Partial<ShortTermPlan>) => {
    const response = await api.post<ShortTermPlan>("/finance/plans", plan);
    return response.data;
  },
);

export const updatePlanAction = createAsyncThunk(
  "plans/update",
  async ({ id, data }: { id: string; data: Partial<ShortTermPlan> }) => {
    const response = await api.put<ShortTermPlan>(`/finance/plans/${id}`, data);
    return response.data;
  },
);

export const deletePlanAction = createAsyncThunk(
  "plans/delete",
  async (id: string) => {
    await api.delete(`/finance/plans/${id}`);
    return id;
  },
);

export const plansSlice = createSlice({
  name: "plans",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch plans";
      })
      .addCase(createPlanAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updatePlanAction.fulfilled, (state, action) => {
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deletePlanAction.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
      });
  },
});

export default plansSlice.reducer;
