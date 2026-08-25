import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Register } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as authApi from '../../api/authApi';

vi.mock('../../api/authApi', async () => {
  const actual = await vi.importActual<typeof authApi>('../../api/authApi');
  return { ...actual, registerUser: vi.fn() };
});

function renderRegisterPage(initialEntries: string[] = ['/register']) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Register page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authApi.registerUser).mockReset();
  });

  test('redirects to the dashboard after successful registration', async () => {
    vi.mocked(authApi.registerUser).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'jwt-token',
    });
    const user = userEvent.setup();

    renderRegisterPage();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });

  test('redirects an already-authenticated user straight to the dashboard', () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));

    renderRegisterPage();

    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  test('contains a link to the login page', () => {
    renderRegisterPage();

    expect(screen.getByRole('link', { name: /войти/i })).toHaveAttribute('href', '/login');
  });
});
