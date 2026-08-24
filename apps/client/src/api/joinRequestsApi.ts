import { ApiError } from './authApi';

const API_BASE_URL = 'http://localhost:3000';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id: string;
  userId: string;
  projectId: string;
  status: JoinRequestStatus;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body.error);
  }

  return body as T;
}

export async function joinProject(code: string): Promise<JoinRequest> {
  const response = await fetch(`${API_BASE_URL}/projects/join`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ code }),
  });
  return parseResponse<JoinRequest>(response);
}
