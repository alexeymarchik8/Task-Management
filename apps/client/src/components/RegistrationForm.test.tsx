import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegistrationForm } from './RegistrationForm';
import * as authApi from '../api/authApi';

vi.mock('../api/authApi', async () => {
  const actual = await vi.importActual<typeof authApi>('../api/authApi');
  return { ...actual, registerUser: vi.fn() };
});

describe('RegistrationForm', () => {
  beforeEach(() => {
    vi.mocked(authApi.registerUser).mockReset();
  });

  test('renders email and password fields', () => {
    render(<RegistrationForm onSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
  });

  test('submits email and password and calls onSuccess with the response', async () => {
    const onSuccess = vi.fn();
    vi.mocked(authApi.registerUser).mockResolvedValue({
      id: '1',
      email: 'user@example.com',
      token: 'jwt-token',
    });
    const user = userEvent.setup();

    render(<RegistrationForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({
        id: '1',
        email: 'user@example.com',
        token: 'jwt-token',
      });
    });
    expect(authApi.registerUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  test('shows a global error message when the email is already registered', async () => {
    vi.mocked(authApi.registerUser).mockRejectedValue(
      new authApi.ApiError(409, 'Email already registered'),
    );
    const user = userEvent.setup();

    render(<RegistrationForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
  });

  test('disables the submit button and inputs while the request is in flight', async () => {
    let resolveRequest: (value: authApi.RegisterResponse) => void = () => {};
    vi.mocked(authApi.registerUser).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const user = userEvent.setup();

    render(<RegistrationForm onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/пароль/i), 'password123');
    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/пароль/i)).toBeDisabled();

    resolveRequest({ id: '1', email: 'user@example.com', token: 'jwt-token' });
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });
});
