import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { People } from './index';
import * as projectsApi from '../../../../api/projectsApi';

vi.mock('../../../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../../../api/projectsApi');
  return { ...actual, listMembers: vi.fn() };
});

function renderWithProject(projectId?: string, refreshKey?: number) {
  const path = projectId ? `/dashboard/${projectId}` : '/homepage';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/:projectId" element={<People refreshKey={refreshKey} />} />
        <Route path="/homepage" element={<People refreshKey={refreshKey} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('People', () => {
  beforeEach(() => {
    vi.mocked(projectsApi.listMembers).mockReset();
  });

  test('renders empty/inactive without an open project', () => {
    renderWithProject(undefined);

    expect(screen.getByText('Проект не открыт')).toBeInTheDocument();
    expect(projectsApi.listMembers).not.toHaveBeenCalled();
  });

  test('renders the members of the open project', async () => {
    vi.mocked(projectsApi.listMembers).mockResolvedValue([
      { userId: '1', email: 'owner@example.com', role: 'owner' },
      { userId: '2', email: 'member@example.com', role: 'member' },
    ]);

    renderWithProject('p1');

    await waitFor(() => {
      expect(screen.getByText('owner@example.com')).toBeInTheDocument();
    });
    expect(screen.getByText('member@example.com')).toBeInTheDocument();
    expect(screen.getByText('Владелец')).toBeInTheDocument();
    expect(screen.getByText('Участник')).toBeInTheDocument();
    expect(projectsApi.listMembers).toHaveBeenCalledWith('p1');
  });

  test('refetches members when refreshKey changes, e.g. after a join request is approved', async () => {
    vi.mocked(projectsApi.listMembers).mockResolvedValue([
      { userId: '1', email: 'owner@example.com', role: 'owner' },
    ]);

    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard/p1']}>
        <Routes>
          <Route path="/dashboard/:projectId" element={<People refreshKey={0} />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(projectsApi.listMembers).toHaveBeenCalledTimes(1));

    vi.mocked(projectsApi.listMembers).mockResolvedValue([
      { userId: '1', email: 'owner@example.com', role: 'owner' },
      { userId: '2', email: 'newmember@example.com', role: 'member' },
    ]);

    rerender(
      <MemoryRouter initialEntries={['/dashboard/p1']}>
        <Routes>
          <Route path="/dashboard/:projectId" element={<People refreshKey={1} />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('newmember@example.com')).toBeInTheDocument();
    });
    expect(projectsApi.listMembers).toHaveBeenCalledTimes(2);
  });

  test('does not error when the members fetch fails', async () => {
    vi.mocked(projectsApi.listMembers).mockRejectedValue(new Error('network error'));

    renderWithProject('p1');

    await waitFor(() => expect(projectsApi.listMembers).toHaveBeenCalled());
    expect(screen.queryByText('owner@example.com')).not.toBeInTheDocument();
  });
});
