import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../auth/AuthContext';
import { ThemeToggle } from './index';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false } as MediaQueryList));
  });

  test('toggles the theme when clicked', async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <ThemeToggle />
      </AuthProvider>,
    );

    expect(screen.getByRole('button', { name: 'Включить тёмную тему' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Включить тёмную тему' }));

    expect(screen.getByRole('button', { name: 'Включить светлую тему' })).toBeInTheDocument();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
