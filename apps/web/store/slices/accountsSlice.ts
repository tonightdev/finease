import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Account,
  BatchSyncAccountsDto,
  WealthSnapshot,
  MonthlyDebrief,
} from "@repo/types";
import api from "@/lib/api";

export interface AccountsState {
  items: Account[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  snapshots: WealthSnapshot[];
  debrief: MonthlyDebrief | null;
  debriefLoading: boolean;
}

const initialState: AccountsState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
  snapshots: [],
  debrief: null,
  debriefLoading: false,
};

export const fetchAccounts = createAsyncThunk<
  Account[],
  { force?: boolean } | void
>(
  "accounts/fetchAll",
  async () => {
    const response = await api.get<Account[]>("/finance/accounts");
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const state = getState() as { accounts: AccountsState };
      if (state.accounts.lastFetched !== null || state.accounts.loading) {
        return false;
      }
      return true;
    },
  },
);

export const createAccount = createAsyncThunk(
  "accounts/create",
  async (account: Partial<Account>) => {
    const response = await api.post<Account>("/finance/accounts", account);
    return response.data;
  },
);

export const deleteAccount = createAsyncThunk(
  "accounts/delete",
  async (id: string) => {
    await api.delete(`/finance/accounts/${id}`);
    return id;
  },
);

export const updateAccount = createAsyncThunk(
  "accounts/update",
  async ({ id, data }: { id: string; data: Partial<Account> }) => {
    const response = await api.put<Account>(`/finance/accounts/${id}`, data);
    return response.data;
  },
);

export const batchSyncAccounts = createAsyncThunk(
  "accounts/batchSync",
  async (dto: BatchSyncAccountsDto) => {
    const response = await api.post<{
      updatedAccounts: Account[];
      snapshot: WealthSnapshot;
    }>("/finance/accounts/batch-sync", dto);
    return response.data;
  },
);

export const fetchSnapshots = createAsyncThunk(
  "accounts/fetchSnapshots",
  async (limit: number = 12) => {
    const response = await api.get<WealthSnapshot[]>(
      `/finance/snapshots?limit=${limit}`,
    );
    return response.data;
  },
);

export const fetchMonthlyDebrief = createAsyncThunk(
  "accounts/fetchDebrief",
  async () => {
    const response = await api.get<MonthlyDebrief>("/finance/debrief");
    return response.data;
  },
);

export const deleteSnapshotAction = createAsyncThunk(
  "accounts/deleteSnapshot",
  async (snapshotId: string) => {
    const response = await api.delete<{
      success: boolean;
      id: string;
      revertedAccounts: Account[];
    }>(`/finance/snapshots/${snapshotId}`);
    return response.data;
  },
);

export const updateSnapshotAction = createAsyncThunk(
  "accounts/updateSnapshot",
  async ({
    id,
    data,
  }: {
    id: string;
    data: { note?: string; accountBalances?: Record<string, number> };
  }) => {
    const response = await api.put<{
      snapshot: WealthSnapshot;
      updatedAccounts: Account[];
    }>(`/finance/snapshots/${id}`, data);
    return response.data;
  },
);

export const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    optimisticUpdateBalances: (
      state,
      action: PayloadAction<{ accountId: string; balance: number }[]>,
    ) => {
      action.payload.forEach(({ accountId, balance }) => {
        const item = state.items.find((a) => a.id === accountId);
        if (item) {
          item.balance = balance;
          item.lastSyncedAt = new Date().toISOString();
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch accounts";
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.items = state.items.filter((acc) => acc.id !== action.payload);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (acc) => acc.id === action.payload.id,
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(batchSyncAccounts.fulfilled, (state, action) => {
        action.payload.updatedAccounts.forEach((updated) => {
          const index = state.items.findIndex((a) => a.id === updated.id);
          if (index !== -1) {
            state.items[index] = updated;
          }
        });
        if (action.payload.snapshot) {
          state.snapshots.unshift(action.payload.snapshot);
        }
      })
      .addCase(fetchSnapshots.fulfilled, (state, action) => {
        state.snapshots = action.payload;
      })
      .addCase(deleteSnapshotAction.fulfilled, (state, action) => {
        if (state.snapshots) {
          state.snapshots = state.snapshots.filter(
            (s) => s.id !== action.payload.id,
          );
        }
        if (
          action.payload.revertedAccounts &&
          action.payload.revertedAccounts.length > 0
        ) {
          action.payload.revertedAccounts.forEach((reverted) => {
            const index = state.items.findIndex((a) => a.id === reverted.id);
            if (index !== -1) {
              state.items[index] = reverted;
            }
          });
        }
      })
      .addCase(updateSnapshotAction.fulfilled, (state, action) => {
        if (state.snapshots && action.payload.snapshot) {
          const index = state.snapshots.findIndex(
            (s) => s.id === action.payload.snapshot.id,
          );
          if (index !== -1) {
            state.snapshots[index] = action.payload.snapshot;
          }
        }
        if (
          action.payload.updatedAccounts &&
          action.payload.updatedAccounts.length > 0
        ) {
          action.payload.updatedAccounts.forEach((updated) => {
            const index = state.items.findIndex((a) => a.id === updated.id);
            if (index !== -1) {
              state.items[index] = updated;
            }
          });
        }
      })
      .addCase(fetchMonthlyDebrief.pending, (state) => {
        state.debriefLoading = true;
      })
      .addCase(fetchMonthlyDebrief.fulfilled, (state, action) => {
        state.debriefLoading = false;
        state.debrief = action.payload;
      })
      .addCase(fetchMonthlyDebrief.rejected, (state) => {
        state.debriefLoading = false;
      });
  },
});

export const { optimisticUpdateBalances } = accountsSlice.actions;
export default accountsSlice.reducer;
