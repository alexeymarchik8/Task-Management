import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('starts with no authenticated user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('login stores the user and token, and persists the token to localStorage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    act(() => {
      result.current.login({ id: '1', email: 'user@example.com', token: 'jwt-token' });
    });

    expect(result.current.user).toEqual({ id: '1', email: 'user@example.com' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe('jwt-token');
  });

  test('restores the authenticated user from a token already in localStorage', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ id: '1', email: 'user@example.com' });
  });
});
