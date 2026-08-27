import { describe, test, expect, vi, beforeEach } from 'vitest';
import { listTasks, createTask, updateTask, deleteTask, type Task } from './tasksApi';

const task: Task = {
  id: 'task-1',
  title: 'Write the report',
  description: null,
  status: 'backlog',
  priority: 'medium',
  dueDate: null,
  assigneeId: null,
  projectId: 'project-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  localStorage.setItem('token', 'jwt-token');
});

describe('listTasks', () => {
  test('fetches tasks for a project with the auth header', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([task]),
    } as Response);

    const result = await listTasks('project-1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects/project-1/tasks', {
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual([task]);
  });

  test('throws an ApiError when the request fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Доступ запрещён' }),
    } as Response);

    await expect(listTasks('project-1')).rejects.toMatchObject({
      status: 403,
      message: 'Доступ запрещён',
    });
  });
});

describe('createTask', () => {
  test('posts the task data to the project tasks endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(task),
    } as Response);

    const result = await createTask('project-1', { title: 'Write the report' });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/projects/project-1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      body: JSON.stringify({ title: 'Write the report' }),
    });
    expect(result).toEqual(task);
  });
});

describe('updateTask', () => {
  test('patches the task by id', async () => {
    const updated = { ...task, status: 'done' as const };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(updated),
    } as Response);

    const result = await updateTask('task-1', { status: 'done' });

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/tasks/task-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
      body: JSON.stringify({ status: 'done' }),
    });
    expect(result).toEqual(updated);
  });
});

describe('deleteTask', () => {
  test('sends a DELETE request for the task id', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'task-1' }),
    } as Response);

    const result = await deleteTask('task-1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:3000/tasks/task-1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jwt-token' },
    });
    expect(result).toEqual({ id: 'task-1' });
  });
});
