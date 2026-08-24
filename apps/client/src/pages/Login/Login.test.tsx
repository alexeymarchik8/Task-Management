import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Login } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as authApi from '../../api/authApi';

vi.mock('../../api/authApi', async () => {
  const actual = await vi.importActual<typeof authApi>('../../api/authApi');
  return { ...actual, loginUser: vi.fn() };
});

function renderLoginPage(initialEntries: string[] = ['/login']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Login page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authApi.loginUser).mockReset();
  });

  test('redirects to the dashboard after successful login', async () => {
    vi.mocked(authApi.loginUser).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'jwt-token',
    });
    const user = userEvent.setup();

    renderLoginPage();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });

  test('redirects an already-authenticated user straight to the dashboard', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));

    renderLoginPage();

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  test('contains a link to the register page', () => {
    renderLoginPage();

    expect(screen.getByRole('link', { name: /зарегистрироваться/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
