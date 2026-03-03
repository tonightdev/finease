import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Account } from '@repo/types';
import api from '@/lib/api';

export interface AccountsState {
  items: Account[];
  loading: boolean;
  error: string | null;
}

const initialState: AccountsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async () => {
  const response = await api.get<Account[]>('/finance/accounts');
  return response.data;
});

export const createAccount = createAsyncThunk('accounts/create', async (account: Partial<Account>) => {
  const response = await api.post<Account>('/finance/accounts', account);
  return response.data;
});

export const deleteAccount = createAsyncThunk('accounts/delete', async (id: string) => {
  await api.delete(`/finance/accounts/${id}`);
  return id;
});

export const updateAccount = createAsyncThunk('accounts/update', async ({ id, data }: { id: string; data: Partial<Account> }) => {
  const response = await api.put<Account>(`/finance/accounts/${id}`, data);
  return response.data;
});

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch accounts';
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.items = state.items.filter((acc) => acc.id !== action.payload);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.items.findIndex((acc) => acc.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default accountsSlice.reducer;
