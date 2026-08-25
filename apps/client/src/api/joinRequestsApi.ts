import { ApiError } from './authApi';

const API_BASE_URL = 'http://localhost:3000';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface JoinRequest {
  id: string;
  userId: string;
  projectId: string;
  status: JoinRequestStatus;
}

export interface PendingJoinRequest extends JoinRequest {
  user: { id: string; email: string };
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

export async function listMyJoinRequests(): Promise<JoinRequest[]> {
  const response = await fetch(`${API_BASE_URL}/join-requests`, { headers: authHeaders() });
  return parseResponse<JoinRequest[]>(response);
}

export async function listPendingJoinRequests(): Promise<PendingJoinRequest[]> {
  const response = await fetch(`${API_BASE_URL}/join-requests/pending`, {
    headers: authHeaders(),
  });
  return parseResponse<PendingJoinRequest[]>(response);
}

export async function countPendingJoinRequests(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/join-requests/pending/count`, {
    headers: authHeaders(),
  });
  const { count } = await parseResponse<{ count: number }>(response);
  return count;
}

export async function approveJoinRequest(id: string): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/join-requests/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse<{ id: string; status: string }>(response);
}

export async function rejectJoinRequest(id: string): Promise<{ id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/join-requests/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return parseResponse<{ id: string; status: string }>(response);
}

export async function deleteJoinRequest(id: string): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/join-requests/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse<{ id: string }>(response);
}
