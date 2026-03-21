import { configureStore, combineReducers, Action } from "@reduxjs/toolkit";
import accountsReducer from "./slices/accountsSlice";
import transactionsReducer from "./slices/transactionsSlice";
import goalsReducer from "./slices/goalsSlice";
import statsReducer from "./slices/statsSlice";
import userReducer from "./slices/userSlice";
import categoriesReducer from "./slices/categoriesSlice";
import assetClassesReducer from "./slices/assetClassesSlice";
import remindersReducer from "./slices/remindersSlice";
import simulationReducer from "./slices/simulationSlice";

const appReducer = combineReducers({
  accounts: accountsReducer,
  transactions: transactionsReducer,
  goals: goalsReducer,
  stats: statsReducer,
  user: userReducer,
  categories: categoriesReducer,
  assetClasses: assetClassesReducer,
  reminders: remindersReducer,
  simulation: simulationReducer,
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
