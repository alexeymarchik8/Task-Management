import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginData extends AuthUser {
  token: string;
}

interface AuthState {
  user: AuthUser | null;
}

function readStoredUser(): AuthUser | null {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  if (!token || !storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as AuthUser;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: (): AuthState => ({ user: readStoredUser() }),
  reducers: {
    login: (state, action: PayloadAction<LoginData>) => {
      const { token, ...user } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      state.user = user;
    },
  },
});

export const { login } = authSlice.actions;
export const authReducer = authSlice.reducer;
