import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

export interface YearlyExpense {
  id: string;
  userId: string;
  title: string;
  yearlyAmount: number;
  accountId: string;
  accountName?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface YearlyExpensesState {
  items: YearlyExpense[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: YearlyExpensesState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchYearlyExpenses = createAsyncThunk(
  "yearly/fetchAll",
  async () => {
    const response = await api.get<YearlyExpense[]>("/finance/yearly-expenses");
    return response.data;
  }
);

export const createYearlyExpense = createAsyncThunk(
  "yearly/create",
  async (data: Partial<YearlyExpense>) => {
    const response = await api.post<YearlyExpense>("/finance/yearly-expenses", data);
    return response.data;
  }
);

export const updateYearlyExpense = createAsyncThunk(
  "yearly/update",
  async ({ id, data }: { id: string; data: Partial<YearlyExpense> }) => {
    const response = await api.put<YearlyExpense>(`/finance/yearly-expenses/${id}`, data);
    return response.data;
  }
);

export const deleteYearlyExpense = createAsyncThunk(
  "yearly/delete",
  async (id: string) => {
    await api.delete(`/finance/yearly-expenses/${id}`);
    return id;
  }
);

export const yearlySlice = createSlice({
  name: "yearly",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchYearlyExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchYearlyExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchYearlyExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch yearly expenses";
      })
      .addCase(createYearlyExpense.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateYearlyExpense.fulfilled, (state, action) => {
        const index = state.items.findIndex((i) => i.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteYearlyExpense.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload);
      });
  },
});

export default yearlySlice.reducer;
