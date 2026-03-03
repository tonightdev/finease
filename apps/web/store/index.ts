import { configureStore } from '@reduxjs/toolkit';
import accountsReducer from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';
import goalsReducer from './slices/goalsSlice';
import statsReducer from './slices/statsSlice';
import userReducer from './slices/userSlice';
import categoriesReducer from './slices/categoriesSlice';
import assetClassesReducer from './slices/assetClassesSlice';

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    transactions: transactionsReducer,
    goals: goalsReducer,
    stats: statsReducer,
    user: userReducer,
    categories: categoriesReducer,
    assetClasses: assetClassesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
