import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectList } from './index';
import type { Project } from '../../../../api/projectsApi';

function renderList(projects: Project[]) {
  return render(
    <MemoryRouter>
      <ProjectList projects={projects} />
    </MemoryRouter>,
  );
}

describe('ProjectList', () => {
  test('shows an empty message when there are no projects', () => {
    renderList([]);

    expect(screen.getByText('У вас пока нет проектов')).toBeInTheDocument();
  });

  test('renders a link to the project dashboard for each project', () => {
    renderList([
      { id: 'p1', name: 'Marketing site', code: 'AAAAAAAA', ownerId: '1', createdAt: '2026-01-01' },
      { id: 'p2', name: 'Mobile app', code: 'BBBBBBBB', ownerId: '1', createdAt: '2026-01-01' },
    ]);

    expect(screen.getByRole('link', { name: 'Marketing site' })).toHaveAttribute(
      'href',
      '/dashboard/p1',
    );
    expect(screen.getByRole('link', { name: 'Mobile app' })).toHaveAttribute(
      'href',
      '/dashboard/p2',
    );
  });
});
