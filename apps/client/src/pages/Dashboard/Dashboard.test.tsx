import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as tasksApi from '../../api/tasksApi';
import * as projectsApi from '../../api/projectsApi';

vi.mock('../../api/tasksApi', async () => {
  const actual = await vi.importActual<typeof tasksApi>('../../api/tasksApi');
  return {
    ...actual,
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  };
});

vi.mock('../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../api/projectsApi');
  return {
    ...actual,
    listMembers: vi.fn(),
  };
});

function makeTask(overrides: Partial<tasksApi.Task>): tasksApi.Task {
  return {
    id: overrides.id ?? 'task-1',
    title: overrides.title ?? 'Untitled',
    description: null,
    status: overrides.status ?? 'backlog',
    priority: overrides.priority ?? 'medium',
    dueDate: null,
    assigneeId: null,
    projectId: 'project-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderDashboardPage(initialEntries: string[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/dashboard/:projectId" element={<Dashboard />} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function loginAsTestUser() {
  localStorage.setItem('token', 'jwt-token');
  localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));
}

describe('Dashboard page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(tasksApi.listTasks).mockReset();
    vi.mocked(tasksApi.createTask).mockReset();
    vi.mocked(tasksApi.updateTask).mockReset();
    vi.mocked(tasksApi.deleteTask).mockReset();
    vi.mocked(projectsApi.listMembers).mockReset();
    vi.mocked(projectsApi.listMembers).mockResolvedValue([]);
  });

  test('redirects an unauthenticated user to /login', () => {
    renderDashboardPage(['/dashboard/project-1']);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders the board with tasks fetched for the project in the URL', async () => {
    loginAsTestUser();
    vi.mocked(tasksApi.listTasks).mockResolvedValue([makeTask({ title: 'Write the report' })]);

    renderDashboardPage(['/dashboard/project-1']);

    await waitFor(() => {
      expect(screen.getByText('Write the report')).toBeInTheDocument();
    });
    expect(tasksApi.listTasks).toHaveBeenCalledWith('project-1', {
      status: undefined,
      priority: undefined,
      assigneeId: undefined,
      search: undefined,
    });
    expect(screen.getByRole('region', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument();
  });

  test('creating a task through the form adds a card to the Backlog column', async () => {
    loginAsTestUser();
    vi.mocked(tasksApi.listTasks).mockResolvedValue([]);
    vi.mocked(tasksApi.createTask).mockResolvedValue(
      makeTask({ id: 'new-task', title: 'New task', status: 'backlog' }),
    );
    const user = userEvent.setup();

    renderDashboardPage(['/dashboard/project-1']);
    await waitFor(() => expect(tasksApi.listTasks).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: /новая задача/i }));
    await user.type(screen.getByLabelText('Заголовок'), 'New task');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Backlog' })).toHaveTextContent('New task');
    });
    expect(tasksApi.createTask).toHaveBeenCalledWith(
      'project-1',
      expect.objectContaining({ title: 'New task' }),
    );
  });

  test('changing the status select moves the card to the matching column', async () => {
    loginAsTestUser();
    const task = makeTask({ title: 'Move me', status: 'backlog' });
    vi.mocked(tasksApi.listTasks).mockResolvedValue([task]);
    vi.mocked(tasksApi.updateTask).mockResolvedValue({ ...task, status: 'done' });
    const user = userEvent.setup();

    renderDashboardPage(['/dashboard/project-1']);
    await waitFor(() => expect(screen.getByText('Move me')).toBeInTheDocument());

    await user.selectOptions(screen.getByLabelText('Статус'), 'done');

    expect(tasksApi.updateTask).toHaveBeenCalledWith(task.id, { status: 'done' });
    await waitFor(() => {
      const doneColumn = screen.getByRole('region', { name: 'Done' });
      expect(within(doneColumn).getByText('Move me')).toBeInTheDocument();
    });
    expect(screen.getByRole('region', { name: 'Backlog' })).not.toHaveTextContent('Move me');
  });

  test('deleting a task removes its card from the board', async () => {
    loginAsTestUser();
    const task = makeTask({ title: 'Remove me' });
    vi.mocked(tasksApi.listTasks).mockResolvedValue([task]);
    vi.mocked(tasksApi.deleteTask).mockResolvedValue({ id: task.id });
    const user = userEvent.setup();

    renderDashboardPage(['/dashboard/project-1']);
    await waitFor(() => expect(screen.getByText('Remove me')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Удалить задачу' }));

    await waitFor(() => {
      expect(screen.queryByText('Remove me')).not.toBeInTheDocument();
    });
    expect(tasksApi.deleteTask).toHaveBeenCalledWith(task.id);
  });

  test('selecting a status filter refetches tasks with the status query param', async () => {
    loginAsTestUser();
    vi.mocked(tasksApi.listTasks).mockResolvedValue([]);
    const user = userEvent.setup();

    renderDashboardPage(['/dashboard/project-1']);
    await waitFor(() => expect(tasksApi.listTasks).toHaveBeenCalledTimes(1));

    await user.selectOptions(screen.getByLabelText('Фильтр по статусу'), 'todo');

    await waitFor(() =>
      expect(tasksApi.listTasks).toHaveBeenLastCalledWith('project-1', {
        status: 'todo',
        priority: undefined,
        assigneeId: undefined,
        search: undefined,
      }),
    );
  });

  test('typing a search query refetches tasks with the search query param', async () => {
    loginAsTestUser();
    vi.mocked(tasksApi.listTasks).mockResolvedValue([]);
    const user = userEvent.setup();

    renderDashboardPage(['/dashboard/project-1']);
    await waitFor(() => expect(tasksApi.listTasks).toHaveBeenCalledTimes(1));

    await user.type(screen.getByLabelText('Поиск задач'), 'report');

    await waitFor(() =>
      expect(tasksApi.listTasks).toHaveBeenLastCalledWith('project-1', {
        status: undefined,
        priority: undefined,
        assigneeId: undefined,
        search: 'report',
      }),
    );
  });

  test('reads the initial filters from the URL query string', async () => {
    loginAsTestUser();
    vi.mocked(tasksApi.listTasks).mockResolvedValue([]);

    renderDashboardPage(['/dashboard/project-1?status=done&search=report']);

    await waitFor(() =>
      expect(tasksApi.listTasks).toHaveBeenCalledWith('project-1', {
        status: 'done',
        priority: undefined,
        assigneeId: undefined,
        search: 'report',
      }),
    );
    expect(screen.getByLabelText('Фильтр по статусу')).toHaveValue('done');
    expect(screen.getByLabelText('Поиск задач')).toHaveValue('report');
  });
});
