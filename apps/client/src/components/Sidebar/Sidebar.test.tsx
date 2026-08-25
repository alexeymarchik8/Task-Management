import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as projectsApi from '../../api/projectsApi';
import * as joinRequestsApi from '../../api/joinRequestsApi';
import { ApiError } from '../../api/authApi';

vi.mock('../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../api/projectsApi');
  return { ...actual, listProjects: vi.fn(), createProject: vi.fn() };
});

vi.mock('../../api/joinRequestsApi', async () => {
  const actual = await vi.importActual<typeof joinRequestsApi>('../../api/joinRequestsApi');
  return {
    ...actual,
    joinProject: vi.fn(),
    listMyJoinRequests: vi.fn(),
    listPendingJoinRequests: vi.fn(),
    deleteJoinRequest: vi.fn(),
    approveJoinRequest: vi.fn(),
    rejectJoinRequest: vi.fn(),
  };
});

function renderSidebar() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    </AuthProvider>,
  );
}

function loginAsTestUser() {
  localStorage.setItem('token', 'jwt-token');
  localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));
}

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(projectsApi.listProjects).mockReset();
    vi.mocked(projectsApi.createProject).mockReset();
    vi.mocked(joinRequestsApi.joinProject).mockReset();
    vi.mocked(joinRequestsApi.listMyJoinRequests).mockReset().mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listPendingJoinRequests).mockReset().mockResolvedValue([]);
    vi.mocked(joinRequestsApi.deleteJoinRequest).mockReset();
    vi.mocked(joinRequestsApi.approveJoinRequest).mockReset();
    vi.mocked(joinRequestsApi.rejectJoinRequest).mockReset();
  });

  test('renders nothing for an unauthenticated user', () => {
    const { container } = renderSidebar();

    expect(container).toBeEmptyDOMElement();
  });

  test("renders the user's projects fetched from GET /projects", async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([
      { id: 'p1', name: 'Marketing site', code: 'AAAAAAAA', ownerId: '1', createdAt: '2026-01-01' },
      { id: 'p2', name: 'Mobile app', code: 'BBBBBBBB', ownerId: '1', createdAt: '2026-01-01' },
    ]);

    renderSidebar();

    await waitFor(() => {
      expect(screen.getByText('Marketing site')).toBeInTheDocument();
    });
    expect(screen.getByText('Mobile app')).toBeInTheDocument();
    expect(projectsApi.listProjects).toHaveBeenCalled();
  });

  test('filters the project list by search query', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([
      { id: 'p1', name: 'Marketing site', code: 'AAAAAAAA', ownerId: '1', createdAt: '2026-01-01' },
      { id: 'p2', name: 'Mobile app', code: 'BBBBBBBB', ownerId: '1', createdAt: '2026-01-01' },
    ]);
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(screen.getByText('Marketing site')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Поиск проектов'), 'mobile');

    expect(screen.queryByText('Marketing site')).not.toBeInTheDocument();
    expect(screen.getByText('Mobile app')).toBeInTheDocument();
  });

  test('creating a project adds it to the list without a page reload', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(projectsApi.createProject).mockResolvedValue({
      id: 'p1',
      name: 'New project',
      code: 'AAAAAAAA',
      ownerId: '1',
      createdAt: '2026-01-01',
    });
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(projectsApi.listProjects).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Название проекта'), 'New project');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(() => {
      expect(screen.getByText('New project')).toBeInTheDocument();
    });
    expect(projectsApi.createProject).toHaveBeenCalledWith({ name: 'New project' });
  });

  test('shows the server error when joining by code fails', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.joinProject).mockRejectedValue(new ApiError(400, 'Вы уже в проекте'));
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(projectsApi.listProjects).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Код проекта'), 'AAAAAAAA');
    await user.click(screen.getByRole('button', { name: 'Вступить' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Вы уже в проекте');
  });

  test('shows a confirmation message after a successful join request', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.joinProject).mockResolvedValue({
      id: 'jr1',
      userId: '1',
      projectId: 'p1',
      status: 'pending',
    });
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(projectsApi.listProjects).toHaveBeenCalled());

    await user.type(screen.getByLabelText('Код проекта'), 'AAAAAAAA');
    await user.click(screen.getByRole('button', { name: 'Вступить' }));

    expect(await screen.findByText('Заявка отправлена')).toBeInTheDocument();
  });

  test('shows the statuses of my join requests', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listMyJoinRequests).mockResolvedValue([
      { id: 'jr1', userId: '1', projectId: 'p1', status: 'pending' },
      { id: 'jr2', userId: '1', projectId: 'p2', status: 'rejected' },
    ]);

    renderSidebar();

    await waitFor(() => {
      expect(screen.getByText('Ожидает')).toBeInTheDocument();
    });
    expect(screen.getByText('Отклонена')).toBeInTheDocument();
  });

  test('hiding a rejected join request removes it from the list', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listMyJoinRequests).mockResolvedValue([
      { id: 'jr1', userId: '1', projectId: 'p1', status: 'rejected' },
    ]);
    vi.mocked(joinRequestsApi.deleteJoinRequest).mockResolvedValue({ id: 'jr1' });
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(screen.getByText('Отклонена')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Скрыть' }));

    await waitFor(() => {
      expect(screen.queryByText('Отклонена')).not.toBeInTheDocument();
    });
    expect(joinRequestsApi.deleteJoinRequest).toHaveBeenCalledWith('jr1');
  });

  test('does not show a hide button for a pending join request', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listMyJoinRequests).mockResolvedValue([
      { id: 'jr1', userId: '1', projectId: 'p1', status: 'pending' },
    ]);

    renderSidebar();

    await waitFor(() => expect(screen.getByText('Ожидает')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Скрыть' })).not.toBeInTheDocument();
  });

  test('owner sees a badge with the pending request count and can approve', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listPendingJoinRequests).mockResolvedValue([
      {
        id: 'jr1',
        userId: '2',
        projectId: 'p1',
        status: 'pending',
        user: { id: '2', email: 'applicant@example.com' },
      },
    ]);
    vi.mocked(joinRequestsApi.approveJoinRequest).mockResolvedValue({
      id: 'jr1',
      status: 'approved',
    });
    const user = userEvent.setup();

    renderSidebar();

    await waitFor(() => {
      expect(screen.getByLabelText('Ожидающих заявок: 1')).toBeInTheDocument();
    });
    expect(screen.getByText('applicant@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Принять' }));

    await waitFor(() => {
      expect(screen.queryByText('applicant@example.com')).not.toBeInTheDocument();
    });
    expect(joinRequestsApi.approveJoinRequest).toHaveBeenCalledWith('jr1');
  });

  test('owner can reject a pending request', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listPendingJoinRequests).mockResolvedValue([
      {
        id: 'jr1',
        userId: '2',
        projectId: 'p1',
        status: 'pending',
        user: { id: '2', email: 'applicant@example.com' },
      },
    ]);
    vi.mocked(joinRequestsApi.rejectJoinRequest).mockResolvedValue({
      id: 'jr1',
      status: 'rejected',
    });
    const user = userEvent.setup();

    renderSidebar();
    await waitFor(() => expect(screen.getByText('applicant@example.com')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Отклонить' }));

    await waitFor(() => {
      expect(screen.queryByText('applicant@example.com')).not.toBeInTheDocument();
    });
    expect(joinRequestsApi.rejectJoinRequest).toHaveBeenCalledWith('jr1');
  });

  test('hides the pending-requests section when there are none', async () => {
    loginAsTestUser();
    vi.mocked(projectsApi.listProjects).mockResolvedValue([]);
    vi.mocked(joinRequestsApi.listPendingJoinRequests).mockResolvedValue([]);

    renderSidebar();
    await waitFor(() => expect(joinRequestsApi.listPendingJoinRequests).toHaveBeenCalled());

    expect(screen.queryByRole('button', { name: 'Принять' })).not.toBeInTheDocument();
  });
});
