import { useState, type ReactNode } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { createAppStore, type AppDispatch, type RootState } from '../store/store';
import { login as loginAction, type AuthUser, type LoginData } from '../store/authSlice';

export type { AuthUser } from '../store/authSlice';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => void;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createAppStore());

  return <Provider store={store}>{children}</Provider>;
}

export function useAuth(): AuthContextValue {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();

  return {
    user,
    isAuthenticated: user !== null,
    login: (data: LoginData) => dispatch(loginAction(data)),
  };
}
