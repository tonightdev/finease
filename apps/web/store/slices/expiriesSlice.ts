import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { Expiry } from "@repo/types";

export interface ExpiriesState {
  items: Expiry[];
  archivedItems: Expiry[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: ExpiriesState = {
  items: [],
  archivedItems: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchExpiries = createAsyncThunk(
  "expiries/fetchExpiries",
  async () => {
    const response = await api.get<Expiry[]>("/finance/expiries");
    return response.data;
  },
);

export const fetchArchivedExpiries = createAsyncThunk(
  "expiries/fetchArchivedExpiries",
  async () => {
    const response = await api.get<Expiry[]>("/finance/expiries/archived");
    return response.data;
  },
);

export const createExpiryAction = createAsyncThunk(
  "expiries/createExpiry",
  async (data: Omit<Expiry, "id" | "userId" | "createdAt">) => {
    const response = await api.post<Expiry>("/finance/expiries", data);
    return response.data;
  },
);

export const updateExpiryAction = createAsyncThunk(
  "expiries/updateExpiry",
  async ({ id, data }: { id: string; data: Partial<Expiry> }) => {
    const response = await api.put<Expiry>(`/finance/expiries/${id}`, data);
    return response.data;
  },
);

export const deleteExpiryAction = createAsyncThunk(
  "expiries/deleteExpiry",
  async ({ id, purge }: { id: string; purge?: boolean }) => {
    await api.delete(`/finance/expiries/${id}${purge ? "?hard=true" : ""}`);
    return id;
  },
);

const expiriesSlice = createSlice({
  name: "expiries",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpiries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpiries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchExpiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch expiries";
      })
      .addCase(fetchArchivedExpiries.fulfilled, (state, action) => {
        state.archivedItems = action.payload;
      })
      .addCase(createExpiryAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateExpiryAction.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteExpiryAction.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
        state.archivedItems = state.archivedItems.filter((item) => item.id !== action.payload);
      });
  },
});

export default expiriesSlice.reducer;
