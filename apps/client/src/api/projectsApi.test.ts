import { describe, test, expect, vi, beforeEach } from 'vitest';
import { listProjects, createProject, listMembers, type Project } from './projectsApi';

const project: Project = {
  id: 'p1',
  name: 'Marketing site',
  code: 'AAAAAAAA',
  ownerId: '1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.setItem('token', 'jwt-token');
});

describe('listProjects', () => {
  test('fetches the projects the user belongs to', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([project]),
    } as Response);

    const result = await listProjects();

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual([project]);
  });
});

describe('createProject', () => {
  test('posts the project name and returns the created project', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(project),
    } as Response);

    const result = await createProject({ name: 'Marketing site' });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      body: JSON.stringify({ name: 'Marketing site' }),
    });
    expect(result).toEqual(project);
  });

  test('throws an ApiError when the name is missing', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Название проекта обязательно' }),
    } as Response);

    await expect(createProject({ name: '' })).rejects.toMatchObject({
      status: 400,
      message: 'Название проекта обязательно',
    });
  });
});

describe('listMembers', () => {
  test('fetches the members of a project', async () => {
    const members = [{ userId: '1', email: 'owner@example.com', role: 'owner' as const }];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(members),
    } as Response);

    const result = await listMembers('p1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects/p1/members', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual(members);
  });

  test('throws an ApiError when the requester is not a member', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Доступ запрещён' }),
    } as Response);

    await expect(listMembers('p1')).rejects.toMatchObject({ status: 403 });
  });
});
