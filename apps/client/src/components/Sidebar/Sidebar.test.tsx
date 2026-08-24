import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as projectsApi from '../../api/projectsApi';

vi.mock('../../api/projectsApi', async () => {
  const actual = await vi.importActual<typeof projectsApi>('../../api/projectsApi');
  return { ...actual, listProjects: vi.fn() };
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

describe('Sidebar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(projectsApi.listProjects).mockReset();
  });

  test('renders nothing for an unauthenticated user', () => {
    const { container } = renderSidebar();

    expect(container).toBeEmptyDOMElement();
  });

  test("renders the user's projects fetched from GET /projects", async () => {
    localStorage.setItem('token', 'jwt-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));
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
});
