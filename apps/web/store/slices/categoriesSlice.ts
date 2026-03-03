import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { Category } from '@repo/types';

export interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk('categories/fetchAll', async () => {
  const response = await api.get<Category[]>('/finance/categories');
  return response.data;
});

export const addCategoryAction = createAsyncThunk('categories/add', async (category: Partial<Category>) => {
  const response = await api.post<Category>('/finance/categories', category);
  return response.data;
});

export const updateCategoryAction = createAsyncThunk('categories/update', async ({ id, data }: { id: string; data: Partial<Category> }) => {
  const response = await api.put<Category>(`/finance/categories/${id}`, data);
  return response.data;
});

export const removeCategoryAction = createAsyncThunk('categories/remove', async (id: string) => {
  await api.delete(`/finance/categories/${id}`);
  return id;
});

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch categories';
      })
      .addCase(addCategoryAction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCategoryAction.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeCategoryAction.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  },
});

export default categoriesSlice.reducer;
