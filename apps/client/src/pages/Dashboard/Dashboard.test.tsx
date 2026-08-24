import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as tasksApi from '../../api/tasksApi';

vi.mock('../../api/tasksApi', async () => {
  const actual = await vi.importActual<typeof tasksApi>('../../api/tasksApi');
  return { ...actual, listTasks: vi.fn() };
});

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

describe('Dashboard page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(tasksApi.listTasks).mockReset();
  });

  test('redirects an unauthenticated user to /login', () => {
    renderDashboardPage(['/dashboard/project-1']);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders the board with tasks fetched for the project in the URL', async () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));
    vi.mocked(tasksApi.listTasks).mockResolvedValue([
      {
        id: 'task-1',
        title: 'Write the report',
        description: null,
        status: 'todo',
        priority: 'medium',
        dueDate: null,
        assigneeId: null,
        projectId: 'project-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    renderDashboardPage(['/dashboard/project-1']);

    await waitFor(() => {
      expect(screen.getByText('Write the report')).toBeInTheDocument();
    });
    expect(tasksApi.listTasks).toHaveBeenCalledWith('project-1');
    expect(screen.getByRole('region', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument();
  });
});
