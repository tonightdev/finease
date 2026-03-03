import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { FinancialGoal } from '@repo/types';

export interface GoalsState {
  items: FinancialGoal[];
  loading: boolean;
  error: string | null;
}

const initialState: GoalsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchGoals = createAsyncThunk('goals/fetchAll', async () => {
  const response = await api.get<FinancialGoal[]>('/finance/goals');
  return response.data;
});

export const addGoalAction = createAsyncThunk('goals/add', async (goal: Partial<FinancialGoal>) => {
  const response = await api.post<FinancialGoal>('/finance/goals', goal);
  return response.data;
});

export const updateGoalAction = createAsyncThunk('goals/update', async ({ id, data }: { id: string; data: Partial<FinancialGoal> }) => {
  const response = await api.put<FinancialGoal>(`/finance/goals/${id}`, data);
  return response.data;
});

export const goalsSlice = createSlice({
  name: 'goals',
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
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch goals';
      })
      .addCase(addGoalAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateGoalAction.fulfilled, (state, action) => {
        const index = state.items.findIndex(g => g.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default goalsSlice.reducer;
