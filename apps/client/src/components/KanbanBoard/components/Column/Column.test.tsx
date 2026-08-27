import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Column } from './index';
import type { Task } from '../../../../api/tasksApi';
import type { ColumnConfig } from '../../config';

const column: ColumnConfig = { status: 'todo', label: 'To Do' };

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Untitled',
    description: null,
    status: 'todo',
    priority: 'medium',
    dueDate: null,
    assigneeId: null,
    projectId: 'project-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('Column', () => {
  test('renders the column label and task count', () => {
    render(
      <Column
        column={column}
        tasks={[makeTask(), makeTask({ id: 'task-2' })]}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const region = screen.getByRole('region', { name: 'To Do' });
    expect(within(region).getByText('2')).toBeInTheDocument();
  });

  test('forwards onEdit, onDelete and onStatusChange with the task id', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onStatusChange = vi.fn();
    const task = makeTask({ title: 'My task' });
    const user = userEvent.setup();

    render(
      <Column
        column={column}
        tasks={[task]}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Изменить' }));
    expect(onEdit).toHaveBeenCalledWith(task);

    await user.click(screen.getByRole('button', { name: 'Удалить задачу' }));
    expect(onDelete).toHaveBeenCalledWith(task.id);

    await user.selectOptions(screen.getByLabelText('Статус'), 'done');
    expect(onStatusChange).toHaveBeenCalledWith(task.id, 'done');
  });
});
