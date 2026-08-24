import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './index';
import * as authApi from '../../api/authApi';

vi.mock('../../api/authApi', async () => {
  const actual = await vi.importActual<typeof authApi>('../../api/authApi');
  return { ...actual, loginUser: vi.fn() };
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(authApi.loginUser).mockReset();
  });

  test('renders email and password fields', () => {
    render(<LoginForm onSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  test('submits email and password and calls onSuccess with the response', async () => {
    const onSuccess = vi.fn();
    vi.mocked(authApi.loginUser).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'jwt-token',
    });
    const user = userEvent.setup();

    render(<LoginForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        id: '1',
        email: 'user@example.com',
        token: 'jwt-token',
      });
    });
    expect(authApi.loginUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  test('shows a single generic error message on authentication failure without revealing which field is wrong', async () => {
    vi.mocked(authApi.loginUser).mockRejectedValue(
      new authApi.ApiError(401, 'Invalid email or password'),
    );
    const user = userEvent.setup();

    render(<LoginForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Неверный email или пароль');
  });

  test('disables the submit button and inputs while the request is in flight', async () => {
    let resolveRequest: (value: authApi.LoginResponse) => void = () => {};
    vi.mocked(authApi.loginUser).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<LoginForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /войти/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/пароль/i)).toBeDisabled();

    resolveRequest({ id: '1', email: 'user@example.com', token: 'jwt-token' });
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });
});
