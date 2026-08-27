import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './index';
import { AuthProvider } from '../../auth/AuthContext';

vi.mock('../Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar-stub" />,
}));

function renderLayout(initialEntries: string[]) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/homepage" element={<p>Home page content</p>} />
          </Route>
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

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('redirects an unauthenticated user to /login', () => {
    renderLayout(['/homepage']);

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('renders the matched route content next to the sidebar when authenticated', () => {
    loginAsTestUser();

    renderLayout(['/homepage']);

    expect(screen.getByText('Home page content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-stub')).toBeInTheDocument();
  });
});
