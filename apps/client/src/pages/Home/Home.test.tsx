import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Home } from './index';
import { AuthProvider } from '../../auth/AuthContext';
import * as analyticsApi from '../../api/analyticsApi';

vi.mock('../../api/analyticsApi', async () => {
  const actual = await vi.importActual<typeof analyticsApi>('../../api/analyticsApi');
  return { ...actual, getAnalyticsSummary: vi.fn() };
});

function makeSummary(
  overrides: Partial<analyticsApi.AnalyticsSummary>,
): analyticsApi.AnalyticsSummary {
  return {
    totalTasks: 0,
    byStatus: { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 },
    percentDone: 0,
    projects: [],
    ...overrides,
  };
}

function renderHomePage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/homepage']}>
        <Routes>
          <Route path="/homepage" element={<Home />} />
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/dashboard/:projectId" element={<p>Dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

function loginAsTestUser() {
  localStorage.setItem('token', 'jwt-token');
  localStorage.setItem('user', JSON.stringify({ id: '1', email: 'user@example.com' }));
}

describe('Home page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(analyticsApi.getAnalyticsSummary).mockReset();
  });

  test('redirects an unauthenticated user to /login', () => {
    renderHomePage();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders the total, status breakdown, and percent done from the summary', async () => {
    loginAsTestUser();
    vi.mocked(analyticsApi.getAnalyticsSummary).mockResolvedValue(
      makeSummary({
        totalTasks: 4,
        byStatus: { backlog: 1, todo: 0, in_progress: 1, in_review: 0, done: 2 },
        percentDone: 50,
      }),
    );

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByLabelText('Backlog')).toHaveTextContent('1');
    expect(screen.getByLabelText('Done')).toHaveTextContent('2');
  });

  test('renders the project list with a mini breakdown per project', async () => {
    loginAsTestUser();
    vi.mocked(analyticsApi.getAnalyticsSummary).mockResolvedValue(
      makeSummary({
        totalTasks: 2,
        projects: [
          {
            projectId: 'project-1',
            name: 'Marketing site',
            totalTasks: 2,
            byStatus: { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 2 },
            percentDone: 100,
          },
        ],
      }),
    );

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Marketing site')).toBeInTheDocument();
    });
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  test('clicking a project navigates to its dashboard', async () => {
    loginAsTestUser();
    vi.mocked(analyticsApi.getAnalyticsSummary).mockResolvedValue(
      makeSummary({
        projects: [
          {
            projectId: 'project-42',
            name: 'Marketing site',
            totalTasks: 0,
            byStatus: { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 },
            percentDone: 0,
          },
        ],
      }),
    );
    const user = userEvent.setup();

    renderHomePage();
    await waitFor(() => expect(screen.getByText('Marketing site')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Marketing site/ }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });

  test('renders an empty state without errors when the user has no projects', async () => {
    loginAsTestUser();
    vi.mocked(analyticsApi.getAnalyticsSummary).mockResolvedValue(makeSummary({}));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/пока нет проектов/i)).toBeInTheDocument();
    });
  });
});
