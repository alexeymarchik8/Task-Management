import { ApiError } from './authApi';

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
