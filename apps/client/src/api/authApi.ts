const API_BASE_URL = 'http://localhost:3000';

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginResponse = RegisterResponse;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body.error);
  }

  return body as RegisterResponse;
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body.error);
  }

  return body as LoginResponse;
}
