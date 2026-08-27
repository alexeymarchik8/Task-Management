import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from '../auth/AuthContext';
import { useTheme } from './useTheme';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches } as MediaQueryList));
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  test('defaults to the dark theme when the system prefers dark and nothing is stored', () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => useTheme(), { wrapper: AuthProvider });

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  test('defaults to the light theme when the system prefers light and nothing is stored', () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper: AuthProvider });

    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('uses the theme already stored in localStorage over the system preference', () => {
    localStorage.setItem('theme', 'light');
    stubMatchMedia(true);

    const { result } = renderHook(() => useTheme(), { wrapper: AuthProvider });

    expect(result.current.theme).toBe('light');
  });

  test('toggleTheme flips the theme and persists it to localStorage', () => {
    localStorage.setItem('theme', 'light');
    stubMatchMedia(false);

    const { result } = renderHook(() => useTheme(), { wrapper: AuthProvider });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
