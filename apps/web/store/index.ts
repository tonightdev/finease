import { configureStore, combineReducers, Action } from "@reduxjs/toolkit";
import accountsReducer from "./slices/accountsSlice";
import transactionsReducer from "./slices/transactionsSlice";
import goalsReducer from "./slices/goalsSlice";
import statsReducer from "./slices/statsSlice";
import userReducer from "./slices/userSlice";
import categoriesReducer from "./slices/categoriesSlice";
import assetClassesReducer from "./slices/assetClassesSlice";
import expiriesReducer from "./slices/expiriesSlice";
import strategiesReducer from "./slices/strategiesSlice";
import simulationsReducer from "./slices/simulationsSlice";
import yearlyExpensesReducer from "./slices/yearlySlice";
import uiReducer from "./slices/uiSlice";

const appReducer = combineReducers({
  accounts: accountsReducer,
  transactions: transactionsReducer,
  goals: goalsReducer,
  stats: statsReducer,
  user: userReducer,
  categories: categoriesReducer,
  assetClasses: assetClassesReducer,
  expiries: expiriesReducer,
  strategies: strategiesReducer,
  simulations: simulationsReducer,
  yearlyExpenses: yearlyExpensesReducer,
  ui: uiReducer,
});

const rootReducer = (
  state: Parameters<typeof appReducer>[0] | undefined,
  action: Action
) => {
  if (action.type === "USER_LOGOUT") {
    // Reset state completely to prevent data leaking across users
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
