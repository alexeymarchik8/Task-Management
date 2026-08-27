import { describe, test, expect, vi, beforeEach } from 'vitest';
import { getAnalyticsSummary, type AnalyticsSummary } from './analyticsApi';

const summary: AnalyticsSummary = {
  totalTasks: 4,
  byStatus: { backlog: 1, todo: 1, in_progress: 1, in_review: 0, done: 1 },
  percentDone: 25,
  projects: [
    {
      projectId: 'p1',
      name: 'Marketing site',
      totalTasks: 4,
      byStatus: { backlog: 1, todo: 1, in_progress: 1, in_review: 0, done: 1 },
      percentDone: 25,
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.setItem('token', 'jwt-token');
});

describe('getAnalyticsSummary', () => {
  test('fetches the analytics summary with the auth header', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(summary),
    } as Response);

    const result = await getAnalyticsSummary();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/analytics/summary', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual(summary);
  });

  test('throws an ApiError when unauthenticated', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Требуется авторизация' }),
    } as Response);

    await expect(getAnalyticsSummary()).rejects.toMatchObject({ status: 401 });
  });
});
