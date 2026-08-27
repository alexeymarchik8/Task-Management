import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './authSlice';
import { themeReducer } from './themeSlice';

export function createAppStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
    },
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
