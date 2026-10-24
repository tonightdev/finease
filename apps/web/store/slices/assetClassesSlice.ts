import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";
import { AssetClass } from "@repo/types";

export interface AssetClassesState {
  items: AssetClass[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

const initialState: AssetClassesState = {
  items: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchAssetClasses = createAsyncThunk<
  AssetClass[],
  { force?: boolean } | void
>(
  "assetClasses/fetchAll",
  async () => {
    const response = await api.get<AssetClass[]>("/finance/asset-classes");
    return response.data;
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      const state = getState() as { assetClasses: AssetClassesState };
      if (
        state.assetClasses.lastFetched !== null ||
        state.assetClasses.loading
      ) {
        return false;
      }
      return true;
    },
  },
);

export const addAssetClassAction = createAsyncThunk(
  "assetClasses/add",
  async (assetClass: Partial<AssetClass>) => {
    const response = await api.post<AssetClass>(
      "/finance/asset-classes",
      assetClass,
    );
    return response.data;
  },
);

export const updateAssetClassAction = createAsyncThunk(
  "assetClasses/update",
  async ({ id, data }: { id: string; data: Partial<AssetClass> }) => {
    const response = await api.put<AssetClass>(
      `/finance/asset-classes/${id}`,
      data,
    );
    return response.data;
  },
);

export const removeAssetClassAction = createAsyncThunk(
  "assetClasses/remove",
  async (id: string) => {
    await api.delete(`/finance/asset-classes/${id}`);
    return id;
  },
);

export const assetClassesSlice = createSlice({
  name: "assetClasses",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssetClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchAssetClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch asset classes";
      })
      .addCase(addAssetClassAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateAssetClassAction.fulfilled, (state, action) => {
        const index = state.items.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeAssetClassAction.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload);
      });
  },
});

export default assetClassesSlice.reducer;
