import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Transaction } from '@repo/types';
import api from '@/lib/api';

export interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTransactions = createAsyncThunk('transactions/fetchAll', async () => {
  const response = await api.get<Transaction[]>('/finance/transactions');
  return response.data;
});

export const createTransaction = createAsyncThunk('transactions/create', async (transaction: Partial<Transaction>) => {
  const response = await api.post<Transaction>('/finance/transactions', transaction);
  return response.data;
});

export const deleteTransaction = createAsyncThunk('transactions/delete', async (id: string) => {
  await api.delete(`/finance/transactions/${id}`);
  return id;
});

export const updateTransaction = createAsyncThunk('transactions/update', async ({ id, data }: { id: string, data: Partial<Transaction> }) => {
  const response = await api.put<Transaction>(`/finance/transactions/${id}`, data);
  return response.data;
});

export const confirmTransaction = createAsyncThunk('transactions/confirm', async (id: string) => {
  const response = await api.post<Transaction>(`/finance/transactions/${id}/confirm`);
  return response.data;
});

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch transactions';
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const index = state.items.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default transactionsSlice.reducer;
