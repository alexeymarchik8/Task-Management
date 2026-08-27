import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from './index';
import * as tasksApi from '../../api/tasksApi';
import * as projectsApi from '../../api/projectsApi';

vi.mock('../../api/tasksApi', async () => {
  const actual = await vi.importActual<typeof tasksApi>('../../api/tasksApi');
  return {
    ...actual,
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };
});

vi.mock('../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../api/projectsApi');
  return {
    ...actual,
    listMembers: vi.fn(),
  };
});

function makeTask(overrides: Partial<tasksApi.Task> = {}): tasksApi.Task {
  return {
    id: 'task-1',
    title: 'Untitled',
    description: null,
    status: 'backlog',
    priority: 'medium',
    dueDate: null,
    assigneeId: null,
    projectId: 'project-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const members: projectsApi.Member[] = [
  { userId: 'user-1', email: 'owner@example.com', role: 'owner' },
  { userId: 'user-2', email: 'member@example.com', role: 'member' },
];

describe('TaskForm', () => {
  beforeEach(() => {
    vi.mocked(tasksApi.createTask).mockReset();
    vi.mocked(tasksApi.updateTask).mockReset();
    vi.mocked(projectsApi.listMembers).mockReset();
    vi.mocked(projectsApi.listMembers).mockResolvedValue(members);
  });

  test('loads project members into the assignee select', async () => {
    render(<TaskForm projectId="project-1" onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'owner@example.com' })).toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'member@example.com' })).toBeInTheDocument();
    expect(projectsApi.listMembers).toHaveBeenCalledWith('project-1');
  });

  test('creating a task with a selected assignee sends assigneeId', async () => {
    vi.mocked(tasksApi.createTask).mockResolvedValue(makeTask({ assigneeId: 'user-2' }));
    const onSuccess = vi.fn();
    const user = userEvent.setup();

    render(<TaskForm projectId="project-1" onSuccess={onSuccess} onCancel={vi.fn()} />);
    await waitFor(() => expect(projectsApi.listMembers).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Заголовок'), 'New task');
    await user.selectOptions(screen.getByLabelText('Исполнитель'), 'user-2');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(tasksApi.createTask).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({ assigneeId: 'user-2' }),
    );
  });

  test('pre-selects the current assignee when editing a task', async () => {
    const task = makeTask({ assigneeId: 'user-1' });

    render(<TaskForm projectId="project-1" task={task} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Исполнитель')).toHaveValue('user-1');
    });
  });

  test('defaults to "Не назначен" for a task with no assignee', async () => {
    const task = makeTask({ assigneeId: null });

    render(<TaskForm projectId="project-1" task={task} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    await waitFor(() => expect(projectsApi.listMembers).toHaveBeenCalled());
    expect(screen.getByLabelText('Исполнитель')).toHaveValue('');
  });
});
