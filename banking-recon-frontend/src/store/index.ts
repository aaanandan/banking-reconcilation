import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import reconciliationReducer from './slices/reconciliation.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reconciliation: reconciliationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['reconciliation/setFiles'],
        ignoredPaths: ['reconciliation.bankFiles', 'reconciliation.ledgerFile'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
