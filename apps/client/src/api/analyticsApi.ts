import { ApiError } from './authApi';

export { ApiError } from './authApi';

const API_BASE_URL = 'http://localhost:3000';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export type StatusBreakdown = Record<TaskStatus, number>;

export interface ProjectSummary {
  projectId: string;
  name: string;
  totalTasks: number;
  byStatus: StatusBreakdown;
  percentDone: number;
}

export interface AnalyticsSummary {
  totalTasks: number;
  byStatus: StatusBreakdown;
  percentDone: number;
  projects: ProjectSummary[];
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

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
    headers: authHeaders(),
  });
  return parseResponse<AnalyticsSummary>(response);
}
