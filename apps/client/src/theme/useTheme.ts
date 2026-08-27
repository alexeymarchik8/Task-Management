import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { toggleTheme as toggleThemeAction, type Theme } from '../store/themeSlice';

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return { theme, toggleTheme: () => dispatch(toggleThemeAction()) };
}
