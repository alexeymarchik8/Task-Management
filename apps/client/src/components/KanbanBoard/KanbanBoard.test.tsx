import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanBoard } from './index';
import type { Task } from '../../api/tasksApi';

function makeTask(overrides: Partial<Task>): Task {
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

describe('KanbanBoard', () => {
  test('renders all 5 status columns', () => {
    render(<KanbanBoard tasks={[]} />);

    expect(screen.getByRole('region', { name: 'Backlog' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'To Do' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'In Review' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Done' })).toBeInTheDocument();
  });

  test('places each task card in the column matching its status', () => {
    const tasks = [
      makeTask({ id: '1', title: 'Backlog task', status: 'backlog' }),
      makeTask({ id: '2', title: 'Done task', status: 'done' }),
    ];

    render(<KanbanBoard tasks={tasks} />);

    const backlogColumn = screen.getByRole('region', { name: 'Backlog' });
    const doneColumn = screen.getByRole('region', { name: 'Done' });

    expect(backlogColumn).toHaveTextContent('Backlog task');
    expect(doneColumn).toHaveTextContent('Done task');
    expect(doneColumn).not.toHaveTextContent('Backlog task');
  });
});
