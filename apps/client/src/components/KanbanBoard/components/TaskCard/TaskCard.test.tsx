import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  test('renders the title, description and priority badge', () => {
    const task = makeTask({ title: 'My task', description: 'Some details', priority: 'high' });

    render(<TaskCard task={task} onStatusChange={noop} onEdit={noop} onDelete={noop} />);

    expect(screen.getByText('My task')).toBeInTheDocument();
    expect(screen.getByText('Some details')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('renders a formatted due date when present, and nothing when absent', () => {
    const task = makeTask({ dueDate: '2026-03-15T00:00:00.000Z' });

    const { rerender } = render(
      <TaskCard task={task} onStatusChange={noop} onEdit={noop} onDelete={noop} />,
    );
    expect(screen.getByText(new Date(task.dueDate!).toLocaleDateString())).toBeInTheDocument();

    rerender(
      <TaskCard
        task={makeTask({ dueDate: null })}
        onStatusChange={noop}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    expect(
      screen.queryByText(new Date(task.dueDate!).toLocaleDateString()),
    ).not.toBeInTheDocument();
  });

  test('calls onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();

    render(<TaskCard task={makeTask()} onStatusChange={noop} onEdit={noop} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: 'Удалить задачу' }));

    expect(onDelete).toHaveBeenCalled();
  });

  test('calls onEdit when the edit button is clicked', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();

    render(<TaskCard task={makeTask()} onStatusChange={noop} onEdit={onEdit} onDelete={noop} />);
    await user.click(screen.getByRole('button', { name: 'Изменить' }));

    expect(onEdit).toHaveBeenCalled();
  });

  test('calls onStatusChange with the newly selected status', async () => {
    const onStatusChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TaskCard
        task={makeTask({ status: 'backlog' })}
        onStatusChange={onStatusChange}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Статус'), 'in_progress');

    expect(onStatusChange).toHaveBeenCalledWith('in_progress');
  });
});
