import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskCard } from './index';
import type { Task } from '../../../../api/tasksApi';
import type { Member } from '../../../../api/projectsApi';

const noop = () => {};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Untitled',
    description: null,
    status: 'backlog',
    priority: 'medium',
    dueDate: null,
    assigneeId: null,
    projectId: 'project-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const members: Member[] = [
  { userId: 'user-1', email: 'owner@example.com', role: 'owner' },
  { userId: 'user-2', email: 'member@example.com', role: 'member' },
];

describe('TaskCard', () => {
  test('shows the assignee email when the task has an assignee', () => {
    const task = makeTask({ assigneeId: 'user-2' });

    render(
      <TaskCard
        task={task}
        members={members}
        onStatusChange={noop}
        onEdit={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('member@example.com')).toBeInTheDocument();
  });

  test('shows "Не назначен" when the task has no assignee', () => {
    const task = makeTask({ assigneeId: null });

    render(
      <TaskCard
        task={task}
        members={members}
        onStatusChange={noop}
        onEdit={noop}
        onDelete={noop}
      />,
    );

    expect(screen.getByText('Не назначен')).toBeInTheDocument();
  });
});
