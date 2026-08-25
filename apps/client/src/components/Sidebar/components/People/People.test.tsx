import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { People } from './index';
import * as projectsApi from '../../../../api/projectsApi';

vi.mock('../../../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../../../api/projectsApi');
  return { ...actual, listMembers: vi.fn() };
});

function renderWithProject(projectId?: string) {
  const path = projectId ? `/dashboard/${projectId}` : '/homepage';
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/dashboard/:projectId" element={<People />} />
        <Route path="/homepage" element={<People />} />
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

  test('does not error when the members fetch fails', async () => {
    vi.mocked(projectsApi.listMembers).mockRejectedValue(new Error('network error'));

    renderWithProject('p1');

    await waitFor(() => expect(projectsApi.listMembers).toHaveBeenCalled());
    expect(screen.queryByText('owner@example.com')).not.toBeInTheDocument();
  });
});
