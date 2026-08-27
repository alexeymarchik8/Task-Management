import { ApiError } from './authApi';

export { ApiError } from './authApi';

const API_BASE_URL = 'http://localhost:3000';

export interface Project {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  createdAt: string;
}

export interface CreateProjectRequest {
  name: string;
}

export type ProjectRole = 'owner' | 'member';

export interface Member {
  userId: string;
  email: string;
  role: ProjectRole;
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

export async function listProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`, { headers: authHeaders() });
  return parseResponse<Project[]>(response);
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse<Project>(response);
}

export async function listMembers(projectId: string): Promise<Member[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, {
    headers: authHeaders(),
  });
  return parseResponse<Member[]>(response);
}

export async function updateProject(id: string, data: { name: string }): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse<Project>(response);
}

export async function deleteProject(id: string): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse<{ id: string }>(response);
}

export async function leaveProject(id: string): Promise<{ userId: string }> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/members/me`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse<{ userId: string }>(response);
}

export async function removeMember(id: string, userId: string): Promise<{ userId: string }> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}/members/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return parseResponse<{ userId: string }>(response);
}
