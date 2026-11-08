import { configureStore, combineReducers, Action } from "@reduxjs/toolkit";
import accountsReducer from "./slices/accountsSlice";
import transactionsReducer from "./slices/transactionsSlice";
import goalsReducer from "./slices/goalsSlice";
import userReducer from "./slices/userSlice";
import categoriesReducer from "./slices/categoriesSlice";
import assetClassesReducer from "./slices/assetClassesSlice";
import expiriesReducer from "./slices/expiriesSlice";
import strategiesReducer from "./slices/strategiesSlice";
import simulationsReducer from "./slices/simulationsSlice";
import yearlyExpensesReducer from "./slices/yearlySlice";
import uiReducer from "./slices/uiSlice";
import { parseJwtPayload } from "@/lib/api";

const appReducer = combineReducers({
  accounts: accountsReducer,
  transactions: transactionsReducer,
  goals: goalsReducer,
  user: userReducer,
  categories: categoriesReducer,
  assetClasses: assetClassesReducer,
  expiries: expiriesReducer,
  strategies: strategiesReducer,
  simulations: simulationsReducer,
  yearlyExpenses: yearlyExpensesReducer,
  ui: uiReducer,
});

export function getActiveReduxPersistenceKey(): string {
  if (typeof window === "undefined") return "finease_redux_cache";
  try {
    const token = localStorage.getItem("finease_token");
    if (!token) return "finease_redux_cache";
    const payload = parseJwtPayload(token);
    const uid = (payload?.uid as string) || (payload?.sub as string);
    return uid ? `finease_redux_cache_${uid}` : "finease_redux_cache";
  } catch {
    return "finease_redux_cache";
  }
}

function loadPreloadedState() {
  if (typeof window === "undefined") return undefined;
  try {
    const key = getActiveReduxPersistenceKey();
    const raw = localStorage.getItem(key);
    // Cleanup legacy un-scoped cache if user-scoped cache is active
    if (!raw && key !== "finease_redux_cache") {
      try {
        localStorage.removeItem("finease_redux_cache");
      } catch {
        // ignore storage errors
      }
    }
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    // Sanitize cached state: reset active loaders, transient error messages, and lastFetched
    // to allow background revalidation while preserving instant 0ms preloaded data
    if (parsed.accounts) {
      parsed.accounts.loading = false;
      parsed.accounts.error = null;
      parsed.accounts.debriefLoading = false;
      parsed.accounts.snapshotsLoading = false;
      parsed.accounts.lastFetched = null;
      parsed.accounts.snapshotsLastFetched = null;
      parsed.accounts.debriefLastFetched = null;
    }
    if (parsed.transactions) {
      parsed.transactions.loading = false;
      parsed.transactions.error = null;
      parsed.transactions.lastFetched = null;
    }
    if (parsed.goals) {
      parsed.goals.loading = false;
      parsed.goals.error = null;
      parsed.goals.lastFetched = null;
    }
    if (parsed.categories) {
      parsed.categories.loading = false;
      parsed.categories.error = null;
      parsed.categories.lastFetched = null;
    }
    if (parsed.assetClasses) {
      parsed.assetClasses.loading = false;
      parsed.assetClasses.error = null;
      parsed.assetClasses.lastFetched = null;
    }
    if (parsed.expiries) {
      parsed.expiries.loading = false;
      parsed.expiries.error = null;
      parsed.expiries.lastFetched = null;
    }
    if (parsed.strategies) {
      parsed.strategies.loading = false;
      parsed.strategies.error = null;
      parsed.strategies.lastFetched = null;
    }
    if (parsed.simulations) {
      parsed.simulations.loading = false;
      parsed.simulations.error = null;
      parsed.simulations.lastFetched = null;
    }
    if (parsed.yearlyExpenses) {
      parsed.yearlyExpenses.loading = false;
      parsed.yearlyExpenses.error = null;
      parsed.yearlyExpenses.lastFetched = null;
    }
    return parsed;
  } catch (e) {
    console.warn("Failed to load preloaded state from cache", e);
    return undefined;
  }
}

const rootReducer = (
  state: Parameters<typeof appReducer>[0] | undefined,
  action: Action,
) => {
  if (action.type === "USER_LOGOUT") {
    // Reset state completely to prevent data leaking across users
    if (typeof window !== "undefined") {
      try {
        const key = getActiveReduxPersistenceKey();
        localStorage.removeItem(key);
        localStorage.removeItem("finease_redux_cache");
      } catch {
        // ignore storage errors
      }
    }
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: loadPreloadedState(),
});

// Debounced background state sync to local storage for instant 0ms PWA re-launches
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

if (typeof window !== "undefined") {
  store.subscribe(() => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const state = store.getState();
        const cache = {
          accounts: state.accounts,
          transactions: state.transactions,
          goals: state.goals,
          categories: state.categories,
          assetClasses: state.assetClasses,
          expiries: state.expiries,
          strategies: state.strategies,
          simulations: state.simulations,
          yearlyExpenses: state.yearlyExpenses,
        };
        const key = getActiveReduxPersistenceKey();
        localStorage.setItem(key, JSON.stringify(cache));
      } catch (err) {
        console.warn("Failed to persist Redux state to cache", err);
      }
    }, 1000);
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
