import { describe, test, expect, vi, beforeEach } from 'vitest';
import { registerUser } from './authApi';

describe('registerUser', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  test('posts email and password to /auth/register and returns the parsed response', async () => {
    const mockResponse = { id: '1', email: 'user@example.com', token: 'jwt-token' };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await registerUser({ email: 'user@example.com', password: 'password123' });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });
    expect(result).toEqual(mockResponse);
  });

  test('throws an ApiError with the server message when the request fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Email already registered' }),
    } as Response);

    await expect(
      registerUser({ email: 'user@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ status: 409, message: 'Email already registered' });
  });
});
