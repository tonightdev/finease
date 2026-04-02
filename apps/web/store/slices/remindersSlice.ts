import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

export interface Reminder {
  id: string;
  name: string;
  type: "policy" | "document" | "other";
  expiryDate: string;
  renewalAmount: number;
  deletedAt?: string | null;
}

export interface RemindersState {
  items: Reminder[];
  archivedItems: Reminder[];
  loading: boolean;
  error: string | null;
}

const initialState: RemindersState = {
  items: [],
  archivedItems: [],
  loading: false,
  error: null,
};

export const fetchReminders = createAsyncThunk(
  "reminders/fetchReminders",
  async () => {
    const response = await api.get<Reminder[]>("/finance/reminders");
    return response.data;
  },
);

export const fetchArchivedReminders = createAsyncThunk(
  "reminders/fetchArchivedReminders",
  async () => {
    const response = await api.get<Reminder[]>("/finance/reminders/archived");
    return response.data;
  },
);

export const createReminder = createAsyncThunk(
  "reminders/createReminder",
  async (data: Omit<Reminder, "id">) => {
    const response = await api.post<Reminder>("/finance/reminders", data);
    return response.data;
  },
);

export const updateReminder = createAsyncThunk(
  "reminders/updateReminder",
  async ({ id, data }: { id: string; data: Partial<Reminder> }) => {
    const response = await api.put<Reminder>(`/finance/reminders/${id}`, data);
    return response.data;
  },
);

export const deleteReminder = createAsyncThunk(
  "reminders/deleteReminder",
  async (id: string) => {
    await api.delete(`/finance/reminders/${id}`);
    return id;
  },
);

const remindersSlice = createSlice({
  name: "reminders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch reminders";
      })
      .addCase(fetchArchivedReminders.fulfilled, (state, action) => {
        state.archivedItems = action.payload;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default remindersSlice.reducer;
