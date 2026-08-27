import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  joinProject,
  listMyJoinRequests,
  listPendingJoinRequests,
  countPendingJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  deleteJoinRequest,
  type JoinRequest,
  type PendingJoinRequest,
} from './joinRequestsApi';

const joinRequest: JoinRequest = { id: 'jr1', userId: '1', projectId: 'p1', status: 'pending' };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.setItem('token', 'jwt-token');
});

describe('joinProject', () => {
  test('posts the code and returns the created join request', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(joinRequest),
    } as Response);

    const result = await joinProject('AAAAAAAA');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      body: JSON.stringify({ code: 'AAAAAAAA' }),
    });
    expect(result).toEqual(joinRequest);
  });

  test('throws an ApiError when the code is unknown', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Проект не найден' }),
    } as Response);

    await expect(joinProject('ZZZZZZZZ')).rejects.toMatchObject({ status: 404 });
  });
});

describe('listMyJoinRequests', () => {
  test('fetches the current user own join requests', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([joinRequest]),
    } as Response);

    const result = await listMyJoinRequests();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual([joinRequest]);
  });
});

describe('listPendingJoinRequests', () => {
  test("fetches pending requests for the user's owned projects", async () => {
    const pending: PendingJoinRequest[] = [
      { ...joinRequest, user: { id: '2', email: 'applicant@example.com' } },
    ];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(pending),
    } as Response);

    const result = await listPendingJoinRequests();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests/pending', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual(pending);
  });
});

describe('countPendingJoinRequests', () => {
  test('fetches and returns the pending request count', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ count: 3 }),
    } as Response);

    const result = await countPendingJoinRequests();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests/pending/count', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toBe(3);
  });
});

describe('approveJoinRequest', () => {
  test('posts to the approve endpoint for the request id', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'jr1', status: 'approved' }),
    } as Response);

    const result = await approveJoinRequest('jr1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests/jr1/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual({ id: 'jr1', status: 'approved' });
  });
});

describe('rejectJoinRequest', () => {
  test('posts to the reject endpoint for the request id', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'jr1', status: 'rejected' }),
    } as Response);

    const result = await rejectJoinRequest('jr1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests/jr1/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual({ id: 'jr1', status: 'rejected' });
  });
});

describe('deleteJoinRequest', () => {
  test('sends a DELETE request for the request id', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'jr1' }),
    } as Response);

    const result = await deleteJoinRequest('jr1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/join-requests/jr1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual({ id: 'jr1' });
  });

  test('throws an ApiError when the request is not rejected yet', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Заявка ещё не отклонена' }),
    } as Response);

    await expect(deleteJoinRequest('jr1')).rejects.toMatchObject({ status: 400 });
  });
});
